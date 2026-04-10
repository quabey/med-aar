import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { MEDRUNNER_ROLES } from '$lib/data/roles.js';

function getAdmin() {
	return createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
}

/**
 * GET — return stored profile by RSI handle (or 404)
 * If the handle is an old name, return a redirect to the current profile.
 */
export async function GET({ params, locals }) {
	if (!locals.profile?.is_approved) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const handle = decodeURIComponent(params.handle);
	const supabase = getAdmin();

	// Try direct match first
	const { data, error } = await supabase
		.from('medrunner_profiles')
		.select('*')
		.ilike('rsi_handle', handle)
		.single();

	if (!error && data) {
		const { data: siteProfile } = data.discord_id
			? await supabase
					.from('profiles')
					.select('discord_avatar, discord_username')
					.eq('discord_id', data.discord_id)
					.single()
			: { data: null };

		return json({
			profile: {
				...data,
				site_avatar: siteProfile?.discord_avatar || null,
				site_username: siteProfile?.discord_username || null
			}
		});
	}

	// Check if this handle is in someone's previous_handles
	const { data: redirectProfile } = await supabase
		.from('medrunner_profiles')
		.select('rsi_handle')
		.contains('previous_handles', [handle.toLowerCase()])
		.single();

	if (redirectProfile) {
		return json({ redirect: redirectProfile.rsi_handle }, { status: 301 });
	}

	return json({ error: 'Profile not found' }, { status: 404 });
}

/**
 * POST — compute stats from completed_alerts and upsert profile.
 * Uses discord_id to find ALL alerts across handle changes, merges old profiles.
 */
export async function POST({ params, locals }) {
	if (!locals.profile?.is_approved) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const handle = decodeURIComponent(params.handle);
	const supabase = getAdmin();

	// Step 1: Try to fetch alerts by handle first to get the discord_id
	let alerts = [];
	let offset = 0;
	const BATCH = 1000;
	while (true) {
		const { data, error } = await supabase
			.rpc('get_medrunner_alerts_by_handle', { p_rsi_handle: handle })
			.range(offset, offset + BATCH - 1);

		if (error) {
			console.error('Error fetching medrunner alerts:', error);
			return json({ error: 'Failed to fetch alerts' }, { status: 500 });
		}

		if (!data || data.length === 0) break;
		alerts = alerts.concat(data);
		if (data.length < BATCH) break;
		offset += BATCH;
	}

	// Extract ALL discord_ids from handle-based alerts (handles Discord account changes)
	const discordIds = new Set();
	for (const alert of alerts) {
		const member = findMemberByHandle(handle, alert.responding_team || {});
		if (member?.discordId) discordIds.add(member.discordId);
	}

	// Also check if there's an existing profile with this handle that has a discord_id
	if (discordIds.size === 0) {
		const { data: existingProfile } = await supabase
			.from('medrunner_profiles')
			.select('discord_id')
			.ilike('rsi_handle', handle)
			.single();
		if (existingProfile?.discord_id) discordIds.add(existingProfile.discord_id);
	}

	// Step 2: For EACH discord_id, fetch ALL alerts (across handle changes) and merge
	if (discordIds.size > 0) {
		const seenAlertIds = new Set();
		let allAlerts = [];

		for (const did of discordIds) {
			offset = 0;
			while (true) {
				const { data, error } = await supabase
					.rpc('get_medrunner_alerts_by_discord_id', { p_discord_id: did })
					.range(offset, offset + BATCH - 1);

				if (error) {
					console.error('Error fetching alerts by discord_id:', error);
					break;
				}

				if (!data || data.length === 0) break;
				for (const alert of data) {
					if (!seenAlertIds.has(alert.id)) {
						seenAlertIds.add(alert.id);
						allAlerts.push(alert);
					}
				}
				if (data.length < BATCH) break;
				offset += BATCH;
			}
		}

		if (allAlerts.length > 0) {
			alerts = allAlerts;
		}
	}

	// The primary discord_id is the most recent one (for profile storage)
	let discordId = null;
	if (discordIds.size > 0) {
		// Pick the discord_id from the most recent alert
		const sorted = [...alerts].sort((a, b) => (b.creation_timestamp || 0) - (a.creation_timestamp || 0));
		for (const alert of sorted) {
			const member = findMemberByHandle(handle, alert.responding_team || {});
			if (member?.discordId && discordIds.has(member.discordId)) {
				discordId = member.discordId;
				break;
			}
		}
		if (!discordId) discordId = [...discordIds][0];
	}

	if (!alerts || alerts.length === 0) {
		return json({ error: 'No alerts found for this medrunner' }, { status: 404 });
	}

	// Step 3: Compute stats — pass all discordIds so we can find the member across account changes
	const stats = computeStats(handle, alerts, discordId, discordIds);

	// Step 4: Collect all old handles (from alert data) that differ from current
	const allHandles = collectAllHandles(alerts, discordIds);
	const currentHandle = stats.rsi_handle; // The latest handle from alert data
	const previousHandles = allHandles
		.filter((h) => h.toLowerCase() !== currentHandle.toLowerCase())
		.map((h) => h.toLowerCase());

	// Step 5: Delete any stale profiles for old handles
	if (previousHandles.length > 0) {
		for (const oldHandle of previousHandles) {
			await supabase
				.from('medrunner_profiles')
				.delete()
				.ilike('rsi_handle', oldHandle);
		}
	}

	// Step 6: Upsert profile under the current (latest) handle
	const { data: profile, error: upsertError } = await supabase
		.from('medrunner_profiles')
		.upsert(
			{
				rsi_handle: currentHandle,
				...stats,
				previous_handles: previousHandles,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'rsi_handle' }
		)
		.select()
		.single();

	if (upsertError) {
		console.error('Error upserting profile:', upsertError);
		return json({ error: 'Failed to save profile' }, { status: 500 });
	}

	// If the request was for an old handle, return a redirect hint
	const redirectHandle = currentHandle.toLowerCase() !== handle.toLowerCase() ? currentHandle : null;

	// Check for site profile avatar
	const { data: siteProfile } = profile.discord_id
		? await supabase
				.from('profiles')
				.select('discord_avatar, discord_username')
				.eq('discord_id', profile.discord_id)
				.single()
		: { data: null };

	return json({
		profile: {
			...profile,
			site_avatar: siteProfile?.discord_avatar || null,
			site_username: siteProfile?.discord_username || null
		},
		...(redirectHandle ? { redirect: redirectHandle } : {})
	});
}

function computeStats(handle, alerts, knownDiscordId = null, allDiscordIds = new Set()) {
	let rsiHandle = handle;
	let discordId = knownDiscordId;
	let discordUsername = null;
	const roleCounts = {};
	const systemCounts = {};
	const threatCounts = {};
	let successful = 0;
	let failed = 0;
	let cancelled = 0;
	let aborted = 0;
	let noContact = 0;
	let refused = 0;
	let serverError = 0;
	let dispatchCount = 0;
	let fieldCount = 0;
	let fieldSuccessful = 0, fieldFailed = 0, fieldCancelled = 0, fieldAborted = 0;
	let fieldNoContact = 0, fieldRefused = 0, fieldServerError = 0;
	let responseTimes = [];
	let alertDurations = [];
	let ratings = [];
	let partnerCounts = {};
	let firstTs = null;
	let lastTs = null;
	let latestMemberTs = null; // Track the most recent alert to get the latest handle

	// New stat trackers
	const monthCounts = {};
	const dayOfWeekCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
	const hourOfDayCounts = {};
	for (let h = 0; h < 24; h++) hourOfDayCounts[h] = 0;
	const alertDates = []; // for streak calculation
	const clientIds = new Set();
	const clientAlertCounts = {};
	let suspectedTrapCount = 0;

	for (const alert of alerts) {
		// Skip training/test alerts
		if (alert.test === true) continue;

		const team = alert.responding_team;
		if (!team) continue;

		// Find this medrunner — try by handle first, then by any known discord_id
		let member = findMemberByHandle(handle, team);
		if (!member && knownDiscordId) member = findMemberByDiscordId(knownDiscordId, team);
		if (!member) {
			for (const did of allDiscordIds) {
				member = findMemberByDiscordId(did, team);
				if (member) break;
			}
		}
		if (!member) continue;

		// Capture discord info from the most recent alert (by creation_timestamp)
		const alertTs = alert.creation_timestamp || 0;
		if (!latestMemberTs || alertTs > latestMemberTs) {
			latestMemberTs = alertTs;
			if (member.rsiHandle) rsiHandle = member.rsiHandle;
			if (member.discordId) discordId = member.discordId;
			if (member.discordUsername) discordUsername = member.discordUsername;
		}

		// Dispatcher vs field — match by handle or any known discordId
		const isDispatcher = (team.dispatchers || []).some(
			(d) =>
				(d.rsiHandle && d.rsiHandle.toLowerCase() === (member.rsiHandle || handle).toLowerCase()) ||
				(knownDiscordId && d.discordId === knownDiscordId) ||
				(d.discordId && allDiscordIds.has(d.discordId))
		);
		if (isDispatcher) dispatchCount++;
		else fieldCount++;

		// Status counts
		const isField = !isDispatcher;
		if (alert.status === 3) { successful++; if (isField) fieldSuccessful++; }
		else if (alert.status === 4) { failed++; if (isField) fieldFailed++; }
		else if (alert.status === 5) { noContact++; if (isField) fieldNoContact++; }
		else if (alert.status === 6) { cancelled++; if (isField) fieldCancelled++; }
		else if (alert.status === 7) { refused++; if (isField) fieldRefused++; }
		else if (alert.status === 8) { aborted++; if (isField) fieldAborted++; }
		else if (alert.status === 9) { serverError++; if (isField) fieldServerError++; }

		// Role distribution
		if (member.class != null) {
			const roleKey = String(member.class);
			roleCounts[roleKey] = (roleCounts[roleKey] || 0) + 1;
		}

		// Systems
		if (alert.system) {
			systemCounts[alert.system] = (systemCounts[alert.system] || 0) + 1;
		}

		// Threat levels
		if (alert.threat_level != null) {
			const tlKey = String(alert.threat_level);
			threatCounts[tlKey] = (threatCounts[tlKey] || 0) + 1;
		}

		// Response time (creation to accepted) — only for successful alerts
		if (alert.status === 3 && alert.accepted_timestamp && alert.creation_timestamp) {
			const diff = alert.accepted_timestamp - alert.creation_timestamp;
			if (diff > 0 && diff < 86400000) {
				responseTimes.push(diff);
			}
		}

		// Total time on alert (creation to completion)
		if (alert.completion_timestamp && alert.creation_timestamp) {
			const diff = alert.completion_timestamp - alert.creation_timestamp;
			if (diff > 0 && diff < 86400000 * 3) {
				// sanity: under 3 days
				alertDurations.push(diff);
			}
		}

		// Ratings
		if (alert.rating != null && alert.rating > 0) {
			ratings.push(alert.rating);
		}

		// Timestamps
		if (alert.creation_timestamp) {
			if (!firstTs || alert.creation_timestamp < firstTs) firstTs = alert.creation_timestamp;
			if (!lastTs || alert.creation_timestamp > lastTs) lastTs = alert.creation_timestamp;

			// Activity patterns — parse timestamp to date
			const date = tsToDate(alert.creation_timestamp);
			if (date) {
				const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
				monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
				dayOfWeekCounts[date.getUTCDay()] = (dayOfWeekCounts[date.getUTCDay()] || 0) + 1;
				hourOfDayCounts[date.getUTCHours()] = (hourOfDayCounts[date.getUTCHours()] || 0) + 1;
				// Store date string for streak calculation
				const dateStr = date.toISOString().slice(0, 10);
				alertDates.push(dateStr);
			}
		}

		// Client tracking
		const clientKey = alert.client_rsi_handle || alert.client_discord_id;
		if (clientKey) {
			clientIds.add(clientKey);
			clientAlertCounts[clientKey] = (clientAlertCounts[clientKey] || 0) + 1;
		}

		// Suspected traps
		if (alert.aar_suspected_trap) suspectedTrapCount++;

		// Partners — find all other members on this alert
		const allMembers = getAllMembers(team);
		for (const m of allMembers) {
			// Skip self — match by any known discordId or handle
			if (m.discordId && allDiscordIds.has(m.discordId)) continue;
			if (knownDiscordId && m.discordId === knownDiscordId) continue;
			if (m.rsiHandle && m.rsiHandle.toLowerCase() === (member.rsiHandle || handle).toLowerCase()) continue;
			const key = m.rsiHandle || m.discordId;
			if (!key) continue;
			if (!partnerCounts[key]) {
				partnerCounts[key] = {
					rsi_handle: m.rsiHandle || m.discordUsername || m.discordId,
					count: 0
				};
			}
			partnerCounts[key].count++;
			if (m.rsiHandle) partnerCounts[key].rsi_handle = m.rsiHandle;
		}
	}

	// Top 5 partners
	const topPartners = Object.values(partnerCounts)
		.sort((a, b) => b.count - a.count)
		.slice(0, 5)
		.map(({ rsi_handle, count }) => ({ rsi_handle, count }));

	// Sort systems, keep top 10
	const sortedSystems = Object.fromEntries(
		Object.entries(systemCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
	);

	// Average response time in seconds
	const avgResponseTime =
		responseTimes.length > 0
			? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000
			: null;

	// Total time on alerts in seconds
	const totalTimeOnAlerts =
		alertDurations.length > 0
			? alertDurations.reduce((a, b) => a + b, 0) / 1000
			: 0;

	// Average rating
	const avgRating =
		ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

	// --- New stats ---

	// Median response time
	const medianResponseTime = (() => {
		if (responseTimes.length === 0) return null;
		const sorted = [...responseTimes].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		const val = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
		return val / 1000;
	})();

	// Fastest response time
	const fastestResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) / 1000 : null;

	// Average alert duration
	const avgAlertDuration =
		alertDurations.length > 0
			? alertDurations.reduce((a, b) => a + b, 0) / alertDurations.length / 1000
			: null;

	// Longest single alert duration
	const longestAlertDuration = alertDurations.length > 0 ? Math.max(...alertDurations) / 1000 : null;

	// Streak calculation
	const uniqueDates = [...new Set(alertDates)].sort();
	let longestStreak = 0;
	let currentStreak = 0;
	if (uniqueDates.length > 0) {
		let streak = 1;
		let best = 1;
		for (let i = 1; i < uniqueDates.length; i++) {
			const prev = new Date(uniqueDates[i - 1]);
			const curr = new Date(uniqueDates[i]);
			const diffDays = Math.round((curr - prev) / 86400000);
			if (diffDays === 1) {
				streak++;
				if (streak > best) best = streak;
			} else {
				streak = 1;
			}
		}
		longestStreak = best;

		// Current streak — count backwards from today
		const today = new Date().toISOString().slice(0, 10);
		const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
		const lastDate = uniqueDates[uniqueDates.length - 1];
		if (lastDate === today || lastDate === yesterday) {
			currentStreak = 1;
			for (let i = uniqueDates.length - 2; i >= 0; i--) {
				const prev = new Date(uniqueDates[i]);
				const curr = new Date(uniqueDates[i + 1]);
				const diffDays = Math.round((curr - prev) / 86400000);
				if (diffDays === 1) currentStreak++;
				else break;
			}
		}
	}

	// Repeat clients
	const repeatClients = Object.values(clientAlertCounts).filter((c) => c > 1).length;

	// Role versatility — number of distinct roles used
	const roleVersatility = Object.keys(roleCounts).length;

	const total = successful + failed + noContact + cancelled + refused + aborted + serverError;
	const fieldTotal = fieldSuccessful + fieldFailed + fieldNoContact + fieldCancelled + fieldRefused + fieldAborted + fieldServerError;

	// Compute badges
	const badges = computeBadges(
		total,
		successful,
		failed,
		aborted,
		cancelled,
		roleCounts,
		avgResponseTime,
		dispatchCount,
		fieldCount,
		totalTimeOnAlerts,
		threatCounts,
		alertDurations,
		responseTimes
	);

	return {
		rsi_handle: rsiHandle,
		discord_id: discordId,
		discord_username: discordUsername,
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
		average_response_time_seconds: avgResponseTime,
		total_time_on_alerts_seconds: totalTimeOnAlerts,
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
		average_alert_duration_seconds: avgAlertDuration,
		median_response_time_seconds: medianResponseTime,
		fastest_response_time_seconds: fastestResponseTime,
		longest_alert_duration_seconds: longestAlertDuration,
		suspected_trap_count: suspectedTrapCount,
		role_versatility_score: roleVersatility
	};
}

function computeBadges(
	total,
	successful,
	failed,
	aborted,
	cancelled,
	roleCounts,
	avgResponse,
	dispatchCount,
	fieldCount,
	totalTimeSeconds,
	threatCounts,
	alertDurations,
	responseTimes
) {
	const badges = [];

	// Alert milestones — multiple tiers
	if (total >= 3000)
		badges.push({ id: 'immortal', name: 'Immortal', description: '3000+ alerts', tier: 8 });
	else if (total >= 2000)
		badges.push({ id: 'transcendent', name: 'Transcendent', description: '2000+ alerts', tier: 7 });
	else if (total >= 1000)
		badges.push({ id: 'mythic', name: 'Mythic', description: '1000+ alerts', tier: 6 });
	else if (total >= 500)
		badges.push({ id: 'legendary', name: 'Legendary', description: '500+ alerts', tier: 5 });
	else if (total >= 250)
		badges.push({ id: 'elite', name: 'Elite', description: '250+ alerts', tier: 4 });
	else if (total >= 100)
		badges.push({ id: 'veteran', name: 'Veteran', description: '100+ alerts', tier: 3 });
	else if (total >= 50)
		badges.push({ id: 'experienced', name: 'Experienced', description: '50+ alerts', tier: 2 });
	else if (total >= 10)
		badges.push({ id: 'rookie', name: 'Active Responder', description: '10+ alerts', tier: 1 });

	// Success rate (only successes vs fails)
	const completedAlerts = successful + failed;
	if (completedAlerts >= 10) {
		const rate = successful / completedAlerts;
		if (rate >= 0.98)
			badges.push({ id: 'flawless', name: 'Flawless', description: '98%+ success rate', tier: 3 });
		else if (rate >= 0.95)
			badges.push({ id: 'perfect', name: 'Near Perfect', description: '95%+ success rate', tier: 2 });
		else if (rate >= 0.85)
			badges.push({ id: 'reliable', name: 'Reliable', description: '85%+ success rate', tier: 1 });
	}

	// Role badges — one per role that qualifies
	for (const [roleKey, count] of Object.entries(roleCounts)) {
		const roleName = MEDRUNNER_ROLES[roleKey]?.name || 'Unknown';
		const roleId = roleName.toLowerCase().replace(/\s+/g, '_');
		if (count >= 1000)
			badges.push({ id: `god_${roleId}`, name: `${roleName} God`, description: `1000+ alerts as ${roleName}`, tier: 8 });
		else if (count >= 500)
			badges.push({ id: `master_${roleId}`, name: `${roleName} Master`, description: `500+ alerts as ${roleName}`, tier: 5 });
		else if (count >= 200)
			badges.push({ id: `expert_${roleId}`, name: `${roleName} Expert`, description: `200+ alerts as ${roleName}`, tier: 3 });
		else if (count >= 100)
			badges.push({ id: `specialist_${roleId}`, name: `${roleName} Specialist`, description: `100+ alerts as ${roleName}`, tier: 2 });
		else if (count >= 20)
			badges.push({ id: `apprentice_${roleId}`, name: `${roleName} Apprentice`, description: `20+ alerts as ${roleName}`, tier: 1 });
	}

	// Dispatcher
	if (dispatchCount >= 100)
		badges.push({ id: 'dispatch_master', name: 'Overwatch', description: '100+ dispatch missions', tier: 3 });
	else if (dispatchCount >= 50)
		badges.push({ id: 'dispatch_expert', name: 'Coordinator', description: '50+ dispatch missions', tier: 2 });
	else if (dispatchCount >= 25)
		badges.push({ id: 'dispatcher', name: 'Command Center', description: '25+ dispatch missions', tier: 1 });

	// Time dedication badges
	const totalHours = totalTimeSeconds / 3600;
	if (totalHours >= 1000)
		badges.push({ id: 'lifelong', name: 'Lifelong', description: '1000+ hours on alerts', tier: 4 });
	else if (totalHours >= 500)
		badges.push({ id: 'tireless', name: 'Tireless', description: '500+ hours on alerts', tier: 3 });
	else if (totalHours >= 100)
		badges.push({ id: 'dedicated', name: 'Dedicated', description: '100+ hours on alerts', tier: 2 });
	else if (totalHours >= 24)
		badges.push({ id: 'committed', name: 'Committed', description: '24+ hours on alerts', tier: 1 });

	// "You Are a Failure" — 69+ failed alerts
	if (failed >= 69)
		badges.push({ id: 'failure', name: 'You Are a Failure', description: '69+ failed alerts', tier: 1 });

	// "Scared, Potter?" — 100+ no-threat alerts (threat_level === 1 means None)
	const noThreatCount = (threatCounts || {})['1'] || 0;
	if (noThreatCount >= 100)
		badges.push({ id: 'scared_potter', name: 'Scared, Potter?', description: '100+ no-threat alerts', tier: 2 });

	// PvP badges (threat_level === 3 means PvP)
	const pvpCount = (threatCounts || {})['3'] || 0;
	if (pvpCount >= 100)
		badges.push({ id: 'danger_zone_legend', name: 'Danger Zone Legend', description: '100+ PvP alerts', tier: 4 });
	else if (pvpCount >= 50)
		badges.push({ id: 'i_am_the_danger', name: 'I Am the Danger', description: '50+ PvP alerts', tier: 3 });
	else if (pvpCount >= 20)
		badges.push({ id: 'danger_zone', name: 'Welcome to the Danger Zone', description: '20+ PvP alerts', tier: 2 });

	// Marathon badges — longest single alert duration
	const longestAlertSeconds = alertDurations.length > 0 ? Math.max(...alertDurations) / 1000 : 0;
	const longestAlertHours = longestAlertSeconds / 3600;
	if (longestAlertHours >= 8)
		badges.push({ id: 'ultramarathon', name: 'Ultramarathon', description: 'Single alert lasting 8+ hours', tier: 5 });
	else if (longestAlertHours >= 4)
		badges.push({ id: 'ironman', name: 'Ironman', description: 'Single alert lasting 4+ hours', tier: 4 });
	else if (longestAlertHours >= 2)
		badges.push({ id: 'marathon', name: 'Marathon', description: 'Single alert lasting 2+ hours', tier: 3 });
	else if (longestAlertHours >= 1)
		badges.push({ id: 'half_marathon', name: 'Half Marathon', description: 'Single alert lasting 1+ hour', tier: 2 });
	else if (longestAlertSeconds >= 1800)
		badges.push({ id: 'endurance', name: 'Endurance', description: 'Single alert lasting 30+ minutes', tier: 1 });

	// First on Scene — number of alerts responded to within 60 seconds
	const fastResponseCount = (responseTimes || []).filter((t) => t <= 60000).length;
	if (fastResponseCount >= 500)
		badges.push({ id: 'flash_legend', name: 'Speed of Light', description: '500+ alerts responded in under 60s', tier: 5 });
	else if (fastResponseCount >= 200)
		badges.push({ id: 'flash_master', name: 'Lightning Reflexes', description: '200+ alerts responded in under 60s', tier: 4 });
	else if (fastResponseCount >= 100)
		badges.push({ id: 'flash_expert', name: 'First on Scene', description: '100+ alerts responded in under 60s', tier: 3 });
	else if (fastResponseCount >= 50)
		badges.push({ id: 'flash_adept', name: 'Quick Draw', description: '50+ alerts responded in under 60s', tier: 2 });
	else if (fastResponseCount >= 20)
		badges.push({ id: 'flash_rookie', name: 'Ready & Waiting', description: '20+ alerts responded in under 60s', tier: 1 });

	return badges;
}

/** Convert an alert timestamp (could be .NET ticks, ms, or seconds) to a Date */
function tsToDate(ts) {
	if (!ts) return null;
	if (ts > 1e16) return new Date((ts - 621355968000000000) / 10000);
	if (ts > 1e12) return new Date(ts);
	return new Date(ts * 1000);
}

function findMemberByHandle(handle, team) {
	const lowerHandle = handle.toLowerCase();
	const arrays = [team.staff, team.allMembers, team.dispatchers].filter(Array.isArray);
	for (const arr of arrays) {
		for (const member of arr) {
			if (member.rsiHandle && member.rsiHandle.toLowerCase() === lowerHandle) return member;
		}
	}
	return null;
}

function findMemberByDiscordId(discordId, team) {
	const arrays = [team.staff, team.allMembers, team.dispatchers].filter(Array.isArray);
	for (const arr of arrays) {
		for (const member of arr) {
			if (member.discordId === discordId) return member;
		}
	}
	return null;
}

/**
 * Collect all unique RSI handles used by any of the discord_ids across all alerts.
 */
function collectAllHandles(alerts, discordIds) {
	if (!discordIds || discordIds.size === 0) return [];
	const handles = new Set();
	for (const alert of alerts) {
		const team = alert.responding_team;
		if (!team) continue;
		for (const did of discordIds) {
			const member = findMemberByDiscordId(did, team);
			if (member?.rsiHandle) handles.add(member.rsiHandle);
		}
	}
	return [...handles];
}

function getAllMembers(team) {
	return [...(team.staff || []), ...(team.allMembers || []), ...(team.dispatchers || [])].filter(
		(m, i, arr) => arr.findIndex((x) => x.discordId === m.discordId) === i
	);
}
