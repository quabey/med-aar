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
 */
export async function GET({ params, locals }) {
	if (!locals.profile?.is_approved) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const handle = decodeURIComponent(params.handle);
	const supabase = getAdmin();

	const { data, error } = await supabase
		.from('medrunner_profiles')
		.select('*')
		.ilike('rsi_handle', handle)
		.single();

	if (error || !data) {
		return json({ error: 'Profile not found' }, { status: 404 });
	}

	// Check if this medrunner has a site profile (for avatar)
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

/**
 * POST — compute stats from completed_alerts and upsert profile
 */
export async function POST({ params, locals }) {
	if (!locals.profile?.is_approved) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const handle = decodeURIComponent(params.handle);
	const supabase = getAdmin();

	// Fetch all alerts in batches (Supabase caps RPC results at 1000 rows)
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

	if (!alerts || alerts.length === 0) {
		return json({ error: 'No alerts found for this medrunner' }, { status: 404 });
	}

	// Compute stats
	const stats = computeStats(handle, alerts);

	// Upsert profile
	const { data: profile, error: upsertError } = await supabase
		.from('medrunner_profiles')
		.upsert(
			{
				rsi_handle: stats.rsi_handle,
				...stats,
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
		}
	});
}

function computeStats(handle, alerts) {
	let rsiHandle = handle;
	let discordId = null;
	let discordUsername = null;
	const roleCounts = {};
	const systemCounts = {};
	const threatCounts = {};
	let successful = 0;
	let failed = 0;
	let cancelled = 0;
	let dispatchCount = 0;
	let fieldCount = 0;
	let responseTimes = [];
	let alertDurations = [];
	let ratings = [];
	let partnerCounts = {};
	let firstTs = null;
	let lastTs = null;

	for (const alert of alerts) {
		const team = alert.responding_team;
		if (!team) continue;

		// Find this medrunner in the team by rsiHandle
		const member = findMemberByHandle(handle, team);
		if (!member) continue;

		// Capture discord info from last known alert
		if (member.rsiHandle) rsiHandle = member.rsiHandle;
		if (member.discordId) discordId = member.discordId;
		if (member.discordUsername) discordUsername = member.discordUsername;

		// Status counts
		if (alert.status === 3) successful++;
		else if (alert.status === 8) failed++;
		else if (alert.status === 6) cancelled++;

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

		// Dispatcher vs field
		const isDispatcher = (team.dispatchers || []).some(
			(d) => d.rsiHandle && d.rsiHandle.toLowerCase() === handle.toLowerCase()
		);
		if (isDispatcher) dispatchCount++;
		else fieldCount++;

		// Response time (creation to accepted)
		if (alert.accepted_timestamp && alert.creation_timestamp) {
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
		}

		// Partners — find all other members on this alert
		const allMembers = getAllMembers(team);
		for (const m of allMembers) {
			if (m.rsiHandle && m.rsiHandle.toLowerCase() === handle.toLowerCase()) continue;
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

	// Compute badges
	const badges = computeBadges(
		alerts.length,
		successful,
		failed,
		cancelled,
		roleCounts,
		avgResponseTime,
		dispatchCount,
		fieldCount,
		totalTimeOnAlerts
	);

	return {
		rsi_handle: rsiHandle,
		discord_id: discordId,
		discord_username: discordUsername,
		total_alerts: alerts.length,
		successful_alerts: successful,
		failed_alerts: failed,
		cancelled_alerts: cancelled,
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
		average_rating: avgRating
	};
}

function computeBadges(
	total,
	successful,
	failed,
	cancelled,
	roleCounts,
	avgResponse,
	dispatchCount,
	fieldCount,
	totalTimeSeconds
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

	// Fast responder
	if (avgResponse && avgResponse < 60) {
		badges.push({ id: 'lightning', name: 'Lightning', description: 'Avg response under 1 min', tier: 2 });
	} else if (avgResponse && avgResponse < 120) {
		badges.push({ id: 'fast_responder', name: 'Fast Responder', description: 'Avg response under 2 min', tier: 1 });
	}

	// Role specialist
	const topRole = Object.entries(roleCounts).sort(([, a], [, b]) => b - a)[0];
	if (topRole) {
		const roleName = MEDRUNNER_ROLES[topRole[0]]?.name || 'Unknown';
		if (topRole[1] >= 100)
			badges.push({ id: 'master', name: `${roleName} Master`, description: `100+ alerts as ${roleName}`, tier: 3 });
		else if (topRole[1] >= 50)
			badges.push({ id: 'expert', name: `${roleName} Expert`, description: `50+ alerts as ${roleName}`, tier: 2 });
		else if (topRole[1] >= 20)
			badges.push({ id: 'specialist', name: `${roleName} Specialist`, description: `20+ alerts as ${roleName}`, tier: 1 });
	}

	// Dispatcher
	if (dispatchCount >= 100)
		badges.push({ id: 'dispatch_master', name: 'Overwatch', description: '100+ dispatch missions', tier: 3 });
	else if (dispatchCount >= 50)
		badges.push({ id: 'dispatch_expert', name: 'Coordinator', description: '50+ dispatch missions', tier: 2 });
	else if (dispatchCount >= 25)
		badges.push({ id: 'dispatcher', name: 'Command Center', description: '25+ dispatch missions', tier: 1 });

	// Field operator
	if (fieldCount >= 100)
		badges.push({ id: 'field_master', name: 'Frontline', description: '100+ field missions', tier: 3 });
	else if (fieldCount >= 50)
		badges.push({ id: 'field_expert', name: 'Veteran Operator', description: '50+ field missions', tier: 2 });
	else if (fieldCount >= 25)
		badges.push({ id: 'field_ops', name: 'Field Operator', description: '25+ field missions', tier: 1 });

	// Versatile (used 3+ different roles)
	if (Object.keys(roleCounts).length >= 4)
		badges.push({ id: 'polymath', name: 'Polymath', description: 'Served in 4+ roles', tier: 2 });
	else if (Object.keys(roleCounts).length >= 3)
		badges.push({ id: 'versatile', name: 'Versatile', description: 'Served in 3+ roles', tier: 1 });

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

	return badges;
}

	return badges;
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

function getAllMembers(team) {
	return [...(team.staff || []), ...(team.allMembers || []), ...(team.dispatchers || [])].filter(
		(m, i, arr) => arr.findIndex((x) => x.discordId === m.discordId) === i
	);
}
