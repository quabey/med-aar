import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { MEDRUNNER_ROLES } from '$lib/data/roles.js';

// ─── Union-Find (disjoint set) for identity grouping ────────────────────────

class UnionFind {
	constructor() {
		this.parent = {};
		this.rank = {};
	}
	find(x) {
		if (!(x in this.parent)) this.parent[x] = x;
		if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
		return this.parent[x];
	}
	union(x, y) {
		const px = this.find(x), py = this.find(y);
		if (px === py) return;
		const rx = this.rank[px] || 0, ry = this.rank[py] || 0;
		if (rx < ry) { this.parent[px] = py; }
		else if (rx > ry) { this.parent[py] = px; }
		else { this.parent[py] = px; this.rank[px] = rx + 1; }
	}
}

// ─── Timestamp helpers ───────────────────────────────────────────────────────

function tsToDate(ts) {
	if (!ts) return null;
	if (ts > 1e16) return new Date((ts - 621355968000000000) / 10000);
	if (ts > 1e12) return new Date(ts);
	return new Date(ts * 1000);
}

// ─── Stats computation (from flat SQL rows) ──────────────────────────────────

function computeStatsFromRows(rows, currentHandle, allHandles, alertPartnersMap) {
	const roleCounts = {}, systemCounts = {}, threatCounts = {};
	let successful = 0, failed = 0, cancelled = 0, aborted = 0, noContact = 0, refused = 0, serverError = 0;
	let dispatchCount = 0, fieldCount = 0;
	let fieldSuccessful = 0, fieldFailed = 0, fieldCancelled = 0, fieldAborted = 0;
	let fieldNoContact = 0, fieldRefused = 0, fieldServerError = 0;
	const responseTimes = [], alertDurations = [], ratings = [];
	const monthCounts = {}, dayOfWeekCounts = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
	const hourOfDayCounts = {};
	for (let h = 0; h < 24; h++) hourOfDayCounts[h] = 0;
	const alertDates = [];
	const clientIds = new Set(), clientAlertCounts = {};
	let suspectedTrapCount = 0, firstTs = null, lastTs = null;
	const partnerCounts = {};

	const handlesLower = new Set(allHandles.map((h) => h.toLowerCase()));

	for (const row of rows) {
		const status = row.alert_status;
		const isField = !row.is_dispatcher;

		if (status === 3) { successful++; if (isField) fieldSuccessful++; }
		else if (status === 4) { failed++; if (isField) fieldFailed++; }
		else if (status === 5) { noContact++; if (isField) fieldNoContact++; }
		else if (status === 6) { cancelled++; if (isField) fieldCancelled++; }
		else if (status === 7) { refused++; if (isField) fieldRefused++; }
		else if (status === 8) { aborted++; if (isField) fieldAborted++; }
		else if (status === 9) { serverError++; if (isField) fieldServerError++; }

		if (isField) fieldCount++;
		else dispatchCount++;

		if (row.member_class != null) {
			const k = String(row.member_class);
			roleCounts[k] = (roleCounts[k] || 0) + 1;
		}
		if (row.alert_system) systemCounts[row.alert_system] = (systemCounts[row.alert_system] || 0) + 1;
		if (row.threat_lvl != null) {
			const k = String(row.threat_lvl);
			threatCounts[k] = (threatCounts[k] || 0) + 1;
		}

		// Response time — successful alerts only
		if (status === 3 && row.accepted_ts && row.creation_ts) {
			const diff = row.accepted_ts - row.creation_ts;
			if (diff > 0 && diff < 86400000) responseTimes.push(diff);
		}

		if (row.completion_ts && row.creation_ts) {
			const diff = row.completion_ts - row.creation_ts;
			if (diff > 0 && diff < 86400000 * 3) alertDurations.push(diff);
		}

		if (row.alert_rating != null && row.alert_rating > 0) ratings.push(Number(row.alert_rating));

		if (row.creation_ts) {
			if (!firstTs || row.creation_ts < firstTs) firstTs = row.creation_ts;
			if (!lastTs || row.creation_ts > lastTs) lastTs = row.creation_ts;
			const date = tsToDate(row.creation_ts);
			if (date) {
				const mk = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
				monthCounts[mk] = (monthCounts[mk] || 0) + 1;
				dayOfWeekCounts[date.getUTCDay()]++;
				hourOfDayCounts[date.getUTCHours()]++;
				alertDates.push(date.toISOString().slice(0, 10));
			}
		}

		const ck = row.client_handle || row.client_did;
		if (ck) {
			clientIds.add(ck);
			clientAlertCounts[ck] = (clientAlertCounts[ck] || 0) + 1;
		}

		if (row.suspected_trap) suspectedTrapCount++;

		// Partners from the alert's full member list
		const partners = alertPartnersMap.get(row.alert_id) || [];
		for (const p of partners) {
			if (handlesLower.has(p.handle.toLowerCase())) continue; // skip self
			if (!partnerCounts[p.handle]) partnerCounts[p.handle] = 0;
			partnerCounts[p.handle]++;
		}
	}

	// Derived stats
	const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
	const median = (arr) => {
		if (!arr.length) return null;
		const s = [...arr].sort((a, b) => a - b);
		const m = Math.floor(s.length / 2);
		return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
	};

	const avgResponseTime = avg(responseTimes);
	const medianResponseTime = median(responseTimes);
	const fastestResponseTime = responseTimes.length ? Math.min(...responseTimes) : null;
	const totalTimeOnAlerts = alertDurations.reduce((a, b) => a + b, 0);
	const avgAlertDuration = avg(alertDurations);
	const longestAlertDuration = alertDurations.length ? Math.max(...alertDurations) : null;
	const avgRating = avg(ratings);
	const repeatClients = Object.values(clientAlertCounts).filter((c) => c > 1).length;

	// Streak calculation
	const uniqueDates = [...new Set(alertDates)].sort();
	let longestStreak = 0, currentStreak = 0;
	if (uniqueDates.length > 0) {
		let streak = 1, best = 1;
		for (let i = 1; i < uniqueDates.length; i++) {
			const diff = Math.round((new Date(uniqueDates[i]) - new Date(uniqueDates[i - 1])) / 86400000);
			if (diff === 1) { streak++; if (streak > best) best = streak; }
			else streak = 1;
		}
		longestStreak = best;
		const today = new Date().toISOString().slice(0, 10);
		const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
		const lastDate = uniqueDates[uniqueDates.length - 1];
		if (lastDate === today || lastDate === yesterday) {
			currentStreak = 1;
			for (let i = uniqueDates.length - 2; i >= 0; i--) {
				const diff = Math.round((new Date(uniqueDates[i + 1]) - new Date(uniqueDates[i])) / 86400000);
				if (diff === 1) currentStreak++;
				else break;
			}
		}
	}

	const topPartners = Object.entries(partnerCounts)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5)
		.map(([rsi_handle, count]) => ({ rsi_handle, count }));

	const sortedSystems = Object.fromEntries(
		Object.entries(systemCounts).sort(([, a], [, b]) => b - a).slice(0, 10)
	);

	const total = successful + failed + noContact + cancelled + refused + aborted + serverError;
	const fieldTotal = fieldSuccessful + fieldFailed + fieldNoContact + fieldCancelled + fieldRefused + fieldAborted + fieldServerError;
	const badges = computeBadges(
		total, successful, failed, aborted, cancelled,
		roleCounts, avgResponseTime ? avgResponseTime / 1000 : null,
		dispatchCount, fieldCount, totalTimeOnAlerts / 1000,
		threatCounts, alertDurations, responseTimes
	);

	return {
		total_alerts: total,
		successful_alerts: successful,
		failed_alerts: failed,
		aborted_alerts: aborted,
		cancelled_alerts: cancelled,
		no_contact_alerts: noContact,
		refused_alerts: refused,
		server_error_alerts: serverError,
		field_total_alerts: fieldTotal,
		field_successful_alerts: fieldSuccessful,
		field_failed_alerts: fieldFailed,
		field_cancelled_alerts: fieldCancelled,
		field_aborted_alerts: fieldAborted,
		field_no_contact_alerts: fieldNoContact,
		field_refused_alerts: fieldRefused,
		field_server_error_alerts: fieldServerError,
		role_distribution: roleCounts,
		systems_visited: sortedSystems,
		threat_level_distribution: threatCounts,
		first_alert_timestamp: firstTs,
		last_alert_timestamp: lastTs,
		average_response_time_seconds: avgResponseTime ? avgResponseTime / 1000 : null,
		median_response_time_seconds: medianResponseTime ? medianResponseTime / 1000 : null,
		fastest_response_time_seconds: fastestResponseTime ? fastestResponseTime / 1000 : null,
		total_time_on_alerts_seconds: totalTimeOnAlerts / 1000,
		average_alert_duration_seconds: avgAlertDuration ? avgAlertDuration / 1000 : null,
		longest_alert_duration_seconds: longestAlertDuration ? longestAlertDuration / 1000 : null,
		dispatch_count: dispatchCount,
		field_count: fieldCount,
		top_partners: topPartners,
		badges,
		average_rating: avgRating,
		alerts_per_month: monthCounts,
		activity_by_day_of_week: dayOfWeekCounts,
		activity_by_hour_of_day: hourOfDayCounts,
		longest_streak_days: longestStreak,
		current_streak_days: currentStreak,
		unique_clients_helped: clientIds.size,
		repeat_clients: repeatClients,
		suspected_trap_count: suspectedTrapCount,
		role_versatility_score: Object.keys(roleCounts).length
	};
}

function computeBadges(total, successful, failed, aborted, cancelled, roleCounts, avgResponse, dispatchCount, fieldCount, totalTimeSeconds, threatCounts, alertDurations, responseTimes) {
	const badges = [];
	if (total >= 3000) badges.push({ id: 'immortal', name: 'Immortal', description: '3000+ alerts', tier: 8 });
	else if (total >= 2000) badges.push({ id: 'transcendent', name: 'Transcendent', description: '2000+ alerts', tier: 7 });
	else if (total >= 1000) badges.push({ id: 'mythic', name: 'Mythic', description: '1000+ alerts', tier: 6 });
	else if (total >= 500) badges.push({ id: 'legendary', name: 'Legendary', description: '500+ alerts', tier: 5 });
	else if (total >= 250) badges.push({ id: 'elite', name: 'Elite', description: '250+ alerts', tier: 4 });
	else if (total >= 100) badges.push({ id: 'veteran', name: 'Veteran', description: '100+ alerts', tier: 3 });
	else if (total >= 50) badges.push({ id: 'experienced', name: 'Experienced', description: '50+ alerts', tier: 2 });
	else if (total >= 10) badges.push({ id: 'rookie', name: 'Active Responder', description: '10+ alerts', tier: 1 });

	const completed = successful + failed;
	if (completed >= 10) {
		const rate = successful / completed;
		if (rate >= 0.98) badges.push({ id: 'flawless', name: 'Flawless', description: '98%+ success rate', tier: 3 });
		else if (rate >= 0.95) badges.push({ id: 'perfect', name: 'Near Perfect', description: '95%+ success rate', tier: 2 });
		else if (rate >= 0.85) badges.push({ id: 'reliable', name: 'Reliable', description: '85%+ success rate', tier: 1 });
	}

	for (const [roleKey, count] of Object.entries(roleCounts)) {
		const roleName = MEDRUNNER_ROLES[roleKey]?.name || 'Unknown';
		const roleId = roleName.toLowerCase().replace(/\s+/g, '_');
		if (count >= 1000) badges.push({ id: `god_${roleId}`, name: `${roleName} God`, description: `1000+ alerts as ${roleName}`, tier: 8 });
		else if (count >= 500) badges.push({ id: `master_${roleId}`, name: `${roleName} Master`, description: `500+ alerts as ${roleName}`, tier: 5 });
		else if (count >= 200) badges.push({ id: `expert_${roleId}`, name: `${roleName} Expert`, description: `200+ alerts as ${roleName}`, tier: 3 });
		else if (count >= 100) badges.push({ id: `specialist_${roleId}`, name: `${roleName} Specialist`, description: `100+ alerts as ${roleName}`, tier: 2 });
		else if (count >= 20) badges.push({ id: `apprentice_${roleId}`, name: `${roleName} Apprentice`, description: `20+ alerts as ${roleName}`, tier: 1 });
	}

	if (dispatchCount >= 100) badges.push({ id: 'dispatch_master', name: 'Overwatch', description: '100+ dispatch missions', tier: 3 });
	else if (dispatchCount >= 50) badges.push({ id: 'dispatch_expert', name: 'Coordinator', description: '50+ dispatch missions', tier: 2 });
	else if (dispatchCount >= 25) badges.push({ id: 'dispatcher', name: 'Command Center', description: '25+ dispatch missions', tier: 1 });

	const totalHours = totalTimeSeconds / 3600;
	if (totalHours >= 1000) badges.push({ id: 'lifelong', name: 'Lifelong', description: '1000+ hours on alerts', tier: 4 });
	else if (totalHours >= 500) badges.push({ id: 'tireless', name: 'Tireless', description: '500+ hours on alerts', tier: 3 });
	else if (totalHours >= 100) badges.push({ id: 'dedicated', name: 'Dedicated', description: '100+ hours on alerts', tier: 2 });
	else if (totalHours >= 24) badges.push({ id: 'committed', name: 'Committed', description: '24+ hours on alerts', tier: 1 });

	if (failed >= 69) badges.push({ id: 'failure', name: 'You Are a Failure', description: '69+ failed alerts', tier: 1 });

	const noThreatCount = (threatCounts || {})['1'] || 0;
	if (noThreatCount >= 100) badges.push({ id: 'scared_potter', name: 'Scared, Potter?', description: '100+ no-threat alerts', tier: 2 });

	const pvpCount = (threatCounts || {})['3'] || 0;
	if (pvpCount >= 100) badges.push({ id: 'danger_zone_legend', name: 'Danger Zone Legend', description: '100+ PvP alerts', tier: 4 });
	else if (pvpCount >= 50) badges.push({ id: 'i_am_the_danger', name: 'I Am the Danger', description: '50+ PvP alerts', tier: 3 });
	else if (pvpCount >= 20) badges.push({ id: 'danger_zone', name: 'Welcome to the Danger Zone', description: '20+ PvP alerts', tier: 2 });

	const longestSecs = alertDurations.length ? Math.max(...alertDurations) / 1000 : 0;
	const longestHours = longestSecs / 3600;
	if (longestHours >= 8) badges.push({ id: 'ultramarathon', name: 'Ultramarathon', description: 'Single alert lasting 8+ hours', tier: 5 });
	else if (longestHours >= 4) badges.push({ id: 'ironman', name: 'Ironman', description: 'Single alert lasting 4+ hours', tier: 4 });
	else if (longestHours >= 2) badges.push({ id: 'marathon', name: 'Marathon', description: 'Single alert lasting 2+ hours', tier: 3 });
	else if (longestHours >= 1) badges.push({ id: 'half_marathon', name: 'Half Marathon', description: 'Single alert lasting 1+ hour', tier: 2 });
	else if (longestSecs >= 1800) badges.push({ id: 'endurance', name: 'Endurance', description: 'Single alert lasting 30+ minutes', tier: 1 });

	const fastResponseCount = (responseTimes || []).filter((t) => t <= 60000).length;
	if (fastResponseCount >= 500) badges.push({ id: 'flash_legend', name: 'Speed of Light', description: '500+ alerts responded in under 60s', tier: 5 });
	else if (fastResponseCount >= 200) badges.push({ id: 'flash_master', name: 'Lightning Reflexes', description: '200+ alerts responded in under 60s', tier: 4 });
	else if (fastResponseCount >= 100) badges.push({ id: 'flash_expert', name: 'First on Scene', description: '100+ alerts responded in under 60s', tier: 3 });
	else if (fastResponseCount >= 50) badges.push({ id: 'flash_adept', name: 'Quick Draw', description: '50+ alerts responded in under 60s', tier: 2 });
	else if (fastResponseCount >= 20) badges.push({ id: 'flash_rookie', name: 'Ready & Waiting', description: '20+ alerts responded in under 60s', tier: 1 });

	return badges;
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST({ locals, url }) {
	if (!locals.profile?.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const testOnly = url.searchParams.get('test') === 'true';
	const supabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

	// ── Step 1: Fetch all alerts paginated (1000/batch = Supabase PostgREST limit) ──
	const BATCH = 1000;
	let allAlerts = [];
	let offset = 0;
	while (true) {
		const { data, error: alertsError } = await supabase
			.from('completed_alerts')
			.select('id, status, test, creation_timestamp, accepted_timestamp, completion_timestamp, system, threat_level, rating, aar_suspected_trap, client_rsi_handle, client_discord_id, responding_team')
			.or('test.is.null,test.eq.false')
			.range(offset, offset + BATCH - 1);

		if (alertsError) return json({ error: alertsError.message }, { status: 500 });
		if (!data?.length) break;
		allAlerts = allAlerts.concat(data);
		if (data.length < BATCH) break;
		offset += BATCH;
	}

	if (!allAlerts.length) {
		return json({ profiles: 0, message: 'No alerts found in completed_alerts.' });
	}

	// ── Step 1b: Unnest responding_team JSON into flat rows in JS ────────────
	const rows = [];
	for (const alert of allAlerts) {
		const team = alert.responding_team;
		if (!team) continue;

		const dispatcherIds = new Set(
			(team.dispatchers || []).map((d) => d.discordId).filter(Boolean)
		);

		// Union allMembers + staff, deduplicate per alert by discordId then rsiHandle
		const combined = [...(team.allMembers || []), ...(team.staff || [])];
		const seen = new Set();
		for (const m of combined) {
			if (!m.rsiHandle) continue;
			const key = m.discordId || m.rsiHandle.toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);

			rows.push({
				alert_id: String(alert.id),
				rsi_handle: m.rsiHandle,
				discord_id: m.discordId || null,
				member_class: m.class ?? null,
				is_dispatcher: m.discordId ? dispatcherIds.has(m.discordId) : false,
				alert_status: alert.status,
				creation_ts: alert.creation_timestamp,
				accepted_ts: alert.accepted_timestamp,
				completion_ts: alert.completion_timestamp,
				alert_system: alert.system,
				threat_lvl: alert.threat_level,
				alert_rating: alert.rating,
				suspected_trap: alert.aar_suspected_trap ?? false,
				client_handle: alert.client_rsi_handle,
				client_did: alert.client_discord_id
			});
		}
	}

	// ── Step 2: Build alertId -> partners map ────────────────────────────────
	// For partner counting: need all handles on each alert
	const alertPartnersMap = new Map(); // alertId -> [{ handle }]
	for (const row of rows) {
		if (!row.alert_id || !row.rsi_handle) continue;
		if (!alertPartnersMap.has(row.alert_id)) alertPartnersMap.set(row.alert_id, []);
		alertPartnersMap.get(row.alert_id).push({ handle: row.rsi_handle });
	}

	// ── Step 3: Build identity groups via union-find ─────────────────────────
	// Nodes: "h:<handle_lower>" and "d:<discord_id>"
	// Two nodes are unioned if they appear together (same handle+discordId pair, or same discordId+different handle)
	const uf = new UnionFind();
	const handleToLatestInfo = new Map(); // handle_lower -> { rsi_handle, discord_id, ts }

	for (const row of rows) {
		if (!row.rsi_handle) continue;
		const handleKey = `h:${row.rsi_handle.toLowerCase()}`;
		uf.find(handleKey); // ensure node exists

		if (row.discord_id) {
			const discordKey = `d:${row.discord_id}`;
			uf.union(handleKey, discordKey);
		}

		// Track latest handle info per handle node (for discord_username etc.)
		const lo = row.rsi_handle.toLowerCase();
		const existing = handleToLatestInfo.get(lo);
		const ts = row.creation_ts || 0;
		if (!existing || ts > existing.ts) {
			handleToLatestInfo.set(lo, { rsi_handle: row.rsi_handle, discord_id: row.discord_id, ts });
		}
	}

	// ── Step 4: Group rows by identity root ──────────────────────────────────
	const groupRows = new Map(); // root -> rows[]
	const groupHandles = new Map(); // root -> Set<handle_lower>
	const groupLatestTs = new Map(); // root -> { handle, discord_id, ts }

	for (const row of rows) {
		if (!row.rsi_handle) continue;
		const handleKey = `h:${row.rsi_handle.toLowerCase()}`;
		const root = uf.find(handleKey);

		if (!groupRows.has(root)) {
			groupRows.set(root, []);
			groupHandles.set(root, new Set());
		}
		groupRows.get(root).push(row);
		groupHandles.get(root).add(row.rsi_handle.toLowerCase());

		// Track the most-recent handle+discordId for this group
		const ts = row.creation_ts || 0;
		const cur = groupLatestTs.get(root);
		if (!cur || ts > cur.ts) {
			groupLatestTs.set(root, { handle: row.rsi_handle, discord_id: row.discord_id, ts });
		}
	}

	// ── Step 5: Compute stats per group ─────────────────────────────────────
	const profiles = [];

	for (const [root, rows] of groupRows) {
		const latest = groupLatestTs.get(root);
		const currentHandle = latest.handle;
		const discordId = latest.discord_id || null;
		const allHandlesLower = [...groupHandles.get(root)];
		const allHandles = allHandlesLower.map((h) => {
			// Recover original casing from handleToLatestInfo
			return handleToLatestInfo.get(h)?.rsi_handle || h;
		});
		const previousHandles = allHandles
			.filter((h) => h.toLowerCase() !== currentHandle.toLowerCase())
			.map((h) => h.toLowerCase());

		const stats = computeStatsFromRows(rows, currentHandle, allHandles, alertPartnersMap);

		profiles.push({
			rsi_handle: currentHandle,
			discord_id: discordId,
			previous_handles: previousHandles,
			updated_at: new Date().toISOString(),
			...stats
		});
	}

	// ── Test mode: return summary without writing ────────────────────────────
	if (testOnly) {
		// Fetch current profiles to diff
		const { data: existing } = await supabase
			.from('medrunner_profiles')
			.select('rsi_handle, total_alerts');

		const existingHandles = new Set((existing || []).map((p) => p.rsi_handle.toLowerCase()));
		const newHandles = new Set(profiles.map((p) => p.rsi_handle.toLowerCase()));

		const toCreate = profiles.filter((p) => !existingHandles.has(p.rsi_handle.toLowerCase()));
		const toUpdate = profiles.filter((p) => existingHandles.has(p.rsi_handle.toLowerCase()));
		const toDelete = (existing || []).filter((p) => !newHandles.has(p.rsi_handle.toLowerCase()));

		return json({
			test: true,
			summary: {
				total_rows_processed: allAlerts.length,
				identity_groups: profiles.length,
				would_create: toCreate.length,
				would_update: toUpdate.length,
				would_delete: toDelete.length,
			},
			preview: profiles
				.sort((a, b) => b.total_alerts - a.total_alerts)
				.slice(0, 20)
				.map((p) => ({
					rsi_handle: p.rsi_handle,
					discord_id: p.discord_id,
					total_alerts: p.total_alerts,
					previous_handles: p.previous_handles,
					is_new: !existingHandles.has(p.rsi_handle.toLowerCase())
				}))
		});
	}

	// ── Real mode: bulk upsert + clean up stale profiles ────────────────────
	// Delete profiles whose handle no longer appears in any alert
	// (these are old handles that got merged into the canonical handle)
	const canonicalHandles = new Set(profiles.map((p) => p.rsi_handle.toLowerCase()));
	const { data: existing } = await supabase
		.from('medrunner_profiles')
		.select('rsi_handle');

	const staleHandles = (existing || [])
		.map((p) => p.rsi_handle)
		.filter((h) => !canonicalHandles.has(h.toLowerCase()));

	if (staleHandles.length > 0) {
		await supabase.from('medrunner_profiles').delete().in('rsi_handle', staleHandles);
	}

	// Upsert all profiles in batches of 500
	const UPSERT_BATCH = 500;
	let upserted = 0;
	for (let i = 0; i < profiles.length; i += UPSERT_BATCH) {
		const batch = profiles.slice(i, i + UPSERT_BATCH);
		const { error: upsertError } = await supabase
			.from('medrunner_profiles')
			.upsert(batch, { onConflict: 'rsi_handle' });
		if (upsertError) {
			return json({ error: upsertError.message, upserted }, { status: 500 });
		}
		upserted += batch.length;
	}

	return json({
		profiles: upserted,
		stale_deleted: staleHandles.length,
		alerts_scanned: allAlerts.length,
		member_rows: rows.length
	});
}
