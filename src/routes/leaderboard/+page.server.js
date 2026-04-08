import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { MEDRUNNER_ROLES } from '$lib/data/roles.js';

// Only the fast all-time leaderboards (from stored profile data).
// Weekly / monthly are loaded lazily client-side.
export async function load({ locals }) {
	if (!locals.profile?.is_approved) return { leaderboards: {}, totalProfiles: 0 };

	const supabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
	const LIMIT = 15;

	let profiles = [];
	let offset = 0;
	while (true) {
		const { data, error } = await supabase
			.from('medrunner_profiles')
			.select('rsi_handle, total_alerts, successful_alerts, failed_alerts, average_response_time_seconds, fastest_response_time_seconds, longest_alert_duration_seconds, total_time_on_alerts_seconds, longest_streak_days, current_streak_days, role_distribution, average_alert_duration_seconds')
			.gt('total_alerts', 0)
			.order('total_alerts', { ascending: false })
			.range(offset, offset + 999);
		if (error || !data?.length) break;
		profiles = profiles.concat(data);
		if (data.length < 1000) break;
		offset += 1000;
	}

	if (!profiles.length) return { leaderboards: {}, totalProfiles: 0 };

	const top = (arr) => arr.slice(0, LIMIT);
	const sortDesc = (key) => [...profiles].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0));
	const sortAsc  = (key) => [...profiles].filter((p) => p[key] != null && p[key] > 0).sort((a, b) => a[key] - b[key]);
	const pick = (list, key) => list.map((p) => ({ rsi_handle: p.rsi_handle, value: p[key] }));

	const roleLeaderboards = {};
	for (const [roleId, roleInfo] of Object.entries(MEDRUNNER_ROLES)) {
		const withRole = profiles
			.map((p) => ({ rsi_handle: p.rsi_handle, value: p.role_distribution?.[roleId] || 0 }))
			.filter((p) => p.value > 0)
			.sort((a, b) => b.value - a.value)
			.slice(0, LIMIT);
		if (withRole.length > 0)
			roleLeaderboards[roleId] = { name: roleInfo.name, abbreviation: roleInfo.abbreviation, entries: withRole };
	}

	const leaderboards = {
		most_alerts:          pick(top(sortDesc('total_alerts')), 'total_alerts'),
		most_time:            pick(top(sortDesc('total_time_on_alerts_seconds')), 'total_time_on_alerts_seconds'),
		longest_streak:       pick(top(sortDesc('longest_streak_days')), 'longest_streak_days'),
		current_streak:       pick(top([...profiles].filter((p) => (p.current_streak_days ?? 0) > 0).sort((a, b) => b.current_streak_days - a.current_streak_days)), 'current_streak_days'),
		longest_alert:        pick(top(sortDesc('longest_alert_duration_seconds')), 'longest_alert_duration_seconds'),
		most_failed:          pick(top(sortDesc('failed_alerts')), 'failed_alerts'),
		fastest_avg_response: pick(top(sortAsc('average_response_time_seconds')), 'average_response_time_seconds'),
		roles: roleLeaderboards
	};

	return { leaderboards, totalProfiles: profiles.length };
}
