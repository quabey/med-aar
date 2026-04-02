import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { MedrunnerApiClient } from '@medrunner/api-client';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { log } from '$lib/server/logger.js';

const API_BASE = 'https://api.medrunner.space';

export async function GET({ url, locals, platform }) {
	// Allow either admin users or a shared cron secret
	const cronSecret = url.searchParams.get('secret');
	const isAdmin = locals.profile?.is_admin;
	const validSecret = cronSecret && env.CRON_SECRET && cronSecret === env.CRON_SECRET;

	if (!isAdmin && !validSecret) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const token = platform?.env?.MEDRUNNER_TOKEN ?? env.MEDRUNNER_TOKEN;
	if (!token) {
		return json({ error: 'MEDRUNNER_TOKEN not configured' }, { status: 500 });
	}

	try {
		const api = MedrunnerApiClient.buildClient({ refreshToken: token });
		const accessToken = await api.emergency.tokenManager.getAccessToken('completed-sync');

		const res = await fetch(`${API_BASE}/emergency/complete?limit=100`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});

		if (!res.ok) {
			const text = await res.text().catch(() => '');
			await log('alerts.sync.error', `API returned ${res.status}: ${text}`);
			return json({ error: `API returned ${res.status}` }, { status: 502 });
		}

		const data = await res.json();
		const alerts = Array.isArray(data) ? data : data.data ?? [];

		if (alerts.length === 0) {
			await log('alerts.sync', 'No completed alerts returned from API');
			return json({ success: true, upserted: 0 });
		}

		const supabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

		const rows = alerts.map((a) => ({
			id: a.id,
			system: a.system || null,
			subsystem: a.subsystem || null,
			tertiary_location: a.tertiaryLocation || null,
			threat_level: a.threatLevel ?? null,
			client_rsi_handle: a.clientRsiHandle || null,
			client_discord_id: a.clientDiscordId || null,
			client_id: a.clientId || null,
			subscription_tier: a.subscriptionTier || null,
			status: a.status ?? null,
			cancellation_reason: a.cancellationReason ?? null,
			mission_name: a.missionName || null,
			submission_source: a.submissionSource ?? null,
			origin: a.origin ?? null,
			is_complete: a.isComplete ?? null,
			test: a.test ?? null,
			rating: a.rating ?? null,
			rating_remarks: a.ratingRemarks || null,
			creation_timestamp: a.creationTimestamp ?? null,
			accepted_timestamp: a.acceptedTimestamp ?? null,
			completion_timestamp: a.completionTimestamp ?? null,
			created_at: a.createdAt || null,
			updated_at: a.updatedAt || null,
			coord_thread_id: a.coordThreadId || null,
			coord_channel_id: a.coordChannelId || null,
			client_rsi_profile_link: a.clientRsiProfileLink || null,
			client_got_data: a.clientGotData ?? null,
			client_redacted_org: a.clientRedactedOrg ?? null,
			client_reported: a.clientReported ?? null,
			client_user_sid: a.clientUserSid || null,
			aar_services_provided: a.aarServicesProvided ?? null,
			aar_suspected_trap: a.aarSuspectedTrap ?? null,
			aar_remarks: a.aarRemarks || null,
			aar_submitter_staff_id: a.aarSubmitterStaffId || null,
			aar_submitted_on: a.aarSubmittedOn || null,
			aar_has_been_edited: a.aarHasBeenEdited ?? null,
			responding_team: a.respondingTeam ?? null,
			responding_teams: a.respondingTeams ?? null,
			aar_edit_history: a.aarEditHistory ?? null,
			raw: a
		}));

		const { error } = await supabase
			.from('completed_alerts')
			.upsert(rows, { onConflict: 'id' });

		if (error) {
			await log('alerts.sync.error', `Upsert failed: ${error.message}`);
			return json({ error: error.message }, { status: 500 });
		}

		const actor = isAdmin
			? { id: locals.profile.id, name: locals.profile.discord_username }
			: undefined;
		await log('alerts.sync', `Upserted ${rows.length} completed alerts`, actor);

		return json({ success: true, upserted: rows.length });
	} catch (err) {
		await log('alerts.sync.error', err.message || 'Unknown error');
		return json({ error: err.message || 'Sync failed' }, { status: 500 });
	}
}
