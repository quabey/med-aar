import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { MEDRUNNER_ROLES } from '$lib/data/roles.js';

export async function GET({ locals }) {
	if (!locals.profile?.is_approved) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const supabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
	const LIMIT = 15;

	// ── All-time profiles (paginated — Supabase caps at 1000/request) ──────────
	let profiles = [];
	let offset = 0;
	while (true) {
		const { data, error } = await supabase
			.from('medrunner_profiles')
			.select('rsi_handle, total_alerts, successful_alerts, failed_alerts, average_response_time_seconds, fastest_response_time_seconds, longest_alert_duration_seconds, total_time_on_alerts_seconds, longest_streak_days, current_streak_days, role_distribution, average_alert_duration_seconds, alerts_per_month')
			.gt('total_alerts', 0)
			.order('total_alerts', { ascending: false })
			.range(offset, offset + 999);
		if (error) return json({ error: error.message }, { status: 500 });
		if (!data?.length) break;
		profiles = profiles.concat(data);
		if (data.length < 1000) break;
		offset += 1000;
	}

	if (!profiles.length) return json({ leaderboards: {}, monthly: {}, weekly: {}, total_profiles: 0 });

	const top = (arr) => arr.slice(0, LIMIT);
	const sortDesc = (key) => [...profiles].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0));
	const sortAsc = (key) =>
		[...profiles].filter((p) => p[key] != null && p[key] > 0).sort((a, b) => a[key] - b[key]);
	const pick = (list, key) => list.map((p) => ({ rsi_handle: p.rsi_handle, value: p[key] }));

	// ── All-time boards ──────────────────────────────────────
	const roleLeaderboards = {};
	for (const [roleId, roleInfo] of Object.entries(MEDRUNNER_ROLES)) {
		const withRole = profiles
			.map((p) => ({ rsi_handle: p.rsi_handle, value: p.role_distribution?.[roleId] || 0 }))
			.filter((p) => p.value > 0)
			.sort((a, b) => b.value - a.value)
			.slice(0, LIMIT);
		if (withRole.length > 0) {
			roleLeaderboards[roleId] = { name: roleInfo.name, abbreviation: roleInfo.abbreviation, entries: withRole };
		}
	}

	const leaderboards = {
		most_alerts:         pick(top(sortDesc('total_alerts')), 'total_alerts'),
		most_failed:         pick(top(sortDesc('failed_alerts')), 'failed_alerts'),
		most_time:           pick(top(sortDesc('total_time_on_alerts_seconds')), 'total_time_on_alerts_seconds'),
		longest_streak:      pick(top(sortDesc('longest_streak_days')), 'longest_streak_days'),
		current_streak:      pick(top([...profiles].filter((p) => (p.current_streak_days ?? 0) > 0).sort((a, b) => b.current_streak_days - a.current_streak_days)), 'current_streak_days'),
		fastest_avg_response: pick(top(sortAsc('average_response_time_seconds')), 'average_response_time_seconds'),
		fastest_response:    pick(top(sortAsc('fastest_response_time_seconds')), 'fastest_response_time_seconds'),
		longest_alert:       pick(top(sortDesc('longest_alert_duration_seconds')), 'longest_alert_duration_seconds'),
		roles: roleLeaderboards
	};

	// ── Weekly & Monthly from completed_alerts ───────────────────────────
	// creation_timestamp can be .NET ticks (>1e16), ms (>1e12), or seconds.
	// We can't filter reliably at the DB level, so we fetch newest-first and
	// stop once we've passed 30 days back.
	function normalizeTs(ts) {
		if (!ts) return null;
		if (ts > 1e16) return (ts - 621355968000000000) / 10000; // .NET ticks → ms
		if (ts > 1e12) return ts; // already ms
		return ts * 1000; // seconds → ms
	}

	const now = Date.now();
	const weekAgoMs = now - 7 * 24 * 60 * 60 * 1000;
	const monthStartMs = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
	const cutoffMs = monthStartMs; // stop fetching once alert is older than this

	const recentAlerts = [];
	let alertOffset = 0;
	let doneFetching = false;

	while (!doneFetching) {
		const { data: batch, error: batchError } = await supabase
			.from('completed_alerts')
			.select('creation_timestamp, closed_timestamp, accepted_timestamp, responding_team')
			.order('id', { ascending: false })
			.range(alertOffset, alertOffset + 999);
		if (batchError || !batch?.length) break;

		for (const alert of batch) {
			const ts = normalizeTs(alert.creation_timestamp);
			if (ts !== null && ts < cutoffMs) { doneFetching = true; break; }
			recentAlerts.push({ ...alert, _ts: ts });
		}

		if (batch.length < 1000) break;
		alertOffset += 1000;
	}

	const weekStats = {};
	const monthStats = {};

	for (const alert of recentAlerts) {
		const team = alert.responding_team;
		if (!team) continue;
		const members = [
			...(team.staff || []),
			...(team.allMembers || []),
			...(team.dispatchers || [])
		];
		const duration =
			alert.closed_timestamp && alert.accepted_timestamp
				? Math.max(0, (normalizeTs(alert.closed_timestamp) - normalizeTs(alert.accepted_timestamp)) / 1000)
				: 0;
		const seen = new Set();
		for (const m of members) {
			const handle = m.rsiHandle;
			if (!handle || seen.has(handle.toLowerCase())) continue;
			seen.add(handle.toLowerCase());

			if (alert._ts >= monthStartMs) {
				if (!monthStats[handle]) monthStats[handle] = { alerts: 0, time: 0 };
				monthStats[handle].alerts++;
				monthStats[handle].time += duration;
			}
			if (alert._ts >= weekAgoMs) {
				if (!weekStats[handle]) weekStats[handle] = { alerts: 0, time: 0 };
				weekStats[handle].alerts++;
				weekStats[handle].time += duration;
			}
		}
	}

	const buildPeriodBoards = (stats) => ({
		most_alerts: Object.entries(stats)
			.sort(([, a], [, b]) => b.alerts - a.alerts)
			.slice(0, LIMIT)
			.map(([rsi_handle, s]) => ({ rsi_handle, value: s.alerts })),
		most_time: Object.entries(stats)
			.filter(([, s]) => s.time > 0)
			.sort(([, a], [, b]) => b.time - a.time)
			.slice(0, LIMIT)
			.map(([rsi_handle, s]) => ({ rsi_handle, value: s.time }))
	});

	const weekly = buildPeriodBoards(weekStats);
	const monthly = buildPeriodBoards(monthStats);

	return json({
		leaderboards,
		monthly,
		weekly,
		total_profiles: profiles.length
	});
}
