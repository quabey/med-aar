import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env } from '$env/dynamic/private';

export async function GET({ url, locals }) {
	if (!locals.profile?.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const discordIds = url.searchParams
		.get('discord_ids')
		?.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	if (!discordIds?.length) {
		return json({ error: 'discord_ids parameter required' }, { status: 400 });
	}

	const supabase = createClient(publicEnv.PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

	const results = [];

	for (const discordId of discordIds) {
		try {
			// Use textSearch to find discord ID in JSONB responding_team column
			const { count } = await supabase
				.from('completed_alerts')
				.select('id', { count: 'exact' })
				.textSearch('responding_team', discordId, { type: 'plain' })
				.limit(0);

			if (!count) {
				results.push({ discordId, rsiHandle: null, lastAlertTimestamp: null, alertCount: 0 });
				continue;
			}

			// Get the most recent alert for this person
			const { data: lastAlerts } = await supabase
				.from('completed_alerts')
				.select('id, creation_timestamp, responding_team')
				.textSearch('responding_team', discordId, { type: 'plain' })
				.order('creation_timestamp', { ascending: false })
				.limit(1);

			const lastAlert = lastAlerts?.[0];
			const rsiHandle = lastAlert ? extractRsiHandle(discordId, lastAlert.responding_team) : null;

			results.push({
				discordId,
				rsiHandle,
				lastAlertTimestamp: lastAlert?.creation_timestamp || null,
				alertCount: count || 0
			});
		} catch {
			results.push({ discordId, rsiHandle: null, lastAlertTimestamp: null, alertCount: 0 });
		}
	}

	return json({ results });
}

function extractRsiHandle(discordId, respondingTeam) {
	if (!respondingTeam || typeof respondingTeam !== 'object') return null;

	const arrays = [
		respondingTeam.staff,
		respondingTeam.allMembers,
		respondingTeam.dispatchers
	].filter(Array.isArray);

	for (const arr of arrays) {
		for (const member of arr) {
			if (String(member.discordId) === discordId && member.rsiHandle) {
				return member.rsiHandle;
			}
		}
	}

	return null;
}
