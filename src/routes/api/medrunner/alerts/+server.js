import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

const MAX_ALERTS = 100;

function getSupabaseAdmin() {
	return createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
}

export async function GET({ locals }) {
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const supabase = getSupabaseAdmin();
		const { data, error } = await supabase
			.from('cached_alerts')
			.select('*')
			.order('creation_timestamp', { ascending: false })
			.limit(MAX_ALERTS);

		if (error) {
			console.error('Alert fetch error:', error);
			return json({ alerts: [] });
		}

		// Map DB columns back to camelCase for client compatibility
		const alerts = (data || []).map((row) => ({
			id: row.id,
			clientRsiHandle: row.client_rsi_handle,
			missionName: row.mission_name,
			system: row.system,
			subsystem: row.subsystem,
			tertiaryLocation: row.tertiary_location,
			threatLevel: row.threat_level,
			status: row.status,
			creationTimestamp: row.creation_timestamp,
			test: row.test,
			storedAt: row.stored_at
		}));

		return json({ alerts });
	} catch {
		return json({ alerts: [] });
	}
}

export async function POST({ request, locals }) {
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let alert;
	try {
		alert = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	if (!alert || !alert.id) {
		return json({ error: 'Missing alert id' }, { status: 400 });
	}

	try {
		const supabase = getSupabaseAdmin();

		const row = {
			id: alert.id,
			client_rsi_handle: alert.clientRsiHandle || '',
			mission_name: alert.missionName || '',
			system: alert.system || '',
			subsystem: alert.subsystem || '',
			tertiary_location: alert.tertiaryLocation || '',
			threat_level: alert.threatLevel ?? 0,
			status: alert.status ?? 0,
			creation_timestamp: alert.creationTimestamp || Date.now(),
			test: alert.test || false,
			stored_at: Date.now()
		};

		const { error } = await supabase
			.from('cached_alerts')
			.upsert(row, { onConflict: 'id' });

		if (error) {
			console.error('Alert store error:', error);
			return json({ error: 'Failed to store alert' }, { status: 500 });
		}

		// Prune old alerts beyond MAX_ALERTS
		const { data: oldest } = await supabase
			.from('cached_alerts')
			.select('id')
			.order('creation_timestamp', { ascending: false })
			.range(MAX_ALERTS, MAX_ALERTS + 1000);

		if (oldest?.length) {
			const idsToDelete = oldest.map((r) => r.id);
			await supabase.from('cached_alerts').delete().in('id', idsToDelete);
		}

		return json({ success: true });
	} catch (err) {
		console.error('Alert store error:', err);
		return json({ error: 'Failed to store alert' }, { status: 500 });
	}
}
