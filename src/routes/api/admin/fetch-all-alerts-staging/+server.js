import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { MedrunnerApiClient } from '@medrunner/api-client';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { log } from '$lib/server/logger.js';

const API_BASE = 'https://api.staff.medrunner.space';
const PAGE_SIZE = 100;
const UPSERT_BATCH = 500;
const RETRY_DELAYS = [2000, 4000, 8000, 16000, 30000];

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function buildPaginationToken({ creationTimestamp, id }) {
	const payload = {
		isComplete: { N: '1' },
		creationTimestamp: { N: String(creationTimestamp) },
		id: { S: id }
	};
	return Buffer.from(JSON.stringify(payload)).toString('base64');
}

async function fetchPage(accessToken, paginationToken) {
	const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
	if (paginationToken) params.set('paginationToken', paginationToken);

	const res = await fetch(`${API_BASE}/emergency/complete?${params}`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (res.status === 401) throw new Error('AUTH_EXPIRED');
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw Object.assign(new Error(`API ${res.status}: ${text}`), { status: res.status });
	}
	return res.json();
}

async function fetchPageWithRetry(accessToken, paginationToken) {
	for (let attempt = 0; ; attempt++) {
		try {
			return await fetchPage(accessToken, paginationToken);
		} catch (err) {
			if (err.message === 'AUTH_EXPIRED') throw err;
			const retryable = err.status === 429 || (err.status >= 500 && err.status < 600);
			if (!retryable || attempt >= RETRY_DELAYS.length) throw err;
			await sleep(RETRY_DELAYS[attempt]);
		}
	}
}

function alertToRow(a) {
	const aar = a.afterActionReport || {};
	return {
		id: a.id,
		system: a.system ?? null,
		subsystem: a.subsystem ?? null,
		tertiary_location: a.tertiaryLocation ?? null,
		threat_level: a.threatLevel ?? null,
		client_rsi_handle: a.clientRsiHandle ?? null,
		client_discord_id: a.clientDiscordId ?? null,
		client_id: a.clientId ?? null,
		subscription_tier: a.subscriptionTier ?? null,
		status: a.status ?? null,
		cancellation_reason: a.cancellationReason ?? null,
		mission_name: a.missionName ?? null,
		submission_source: a.submissionSource ?? null,
		origin: a.origin ?? null,
		is_complete: a.isComplete ?? null,
		test: a.test ?? null,
		rating: a.rating ?? null,
		rating_remarks: a.ratingRemarks ?? null,
		creation_timestamp: a.creationTimestamp ?? null,
		accepted_timestamp: a.acceptedTimestamp ?? null,
		completion_timestamp: a.completionTimestamp ?? null,
		created_at: a.createdAt ?? null,
		updated_at: a.updatedAt ?? null,
		coord_thread_id: a.coordThreadId ?? null,
		coord_channel_id: a.coordChannelId ?? null,
		client_rsi_profile_link: a.clientRsiProfileLink ?? null,
		client_got_data: a.clientGotData ?? null,
		client_redacted_org: a.clientRedactedOrg ?? null,
		client_reported: a.clientReported ?? null,
		client_user_sid: a.clientUserSid ?? null,
		aar_services_provided: aar.servicesProvided ?? null,
		aar_suspected_trap: aar.suspectedTrap ?? null,
		aar_remarks: aar.remarks ?? null,
		aar_submitter_staff_id: aar.submitterStaffId ?? null,
		aar_submitted_on: aar.submittedOn ?? null,
		aar_has_been_edited: aar.hasBeenEdited ?? null,
		responding_team: a.respondingTeam ?? null,
		responding_teams: a.respondingTeams ?? null,
		aar_edit_history: aar.editHistory ?? null,
		raw: a,
		fetched_at: new Date().toISOString()
	};
}

export async function POST({ locals, request }) {
	if (!locals.profile?.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const token = env.MEDRUNNER_TOKEN;
	if (!token) {
		return json({ error: 'MEDRUNNER_TOKEN not configured' }, { status: 500 });
	}

	// Optional: resume from a pagination token passed in the body
	const body = await request.json().catch(() => ({}));
	let paginationToken = body.paginationToken ?? null;

	const supabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

	const api = MedrunnerApiClient.buildClient({ refreshToken: token });
	let accessToken = await api.emergency.tokenManager.getAccessToken('staging-fetch');
	if (!accessToken) return json({ error: 'Failed to obtain access token' }, { status: 500 });

	let totalFetched = 0;
	let totalUpserted = 0;
	let pageNum = 0;
	let batch = [];

	async function flushBatch() {
		if (batch.length === 0) return;
		for (let i = 0; i < batch.length; i += UPSERT_BATCH) {
			const slice = batch.slice(i, i + UPSERT_BATCH);
			const { error } = await supabase
				.from('completed_alerts_staging')
				.upsert(slice, { onConflict: 'id' });
			if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
			totalUpserted += slice.length;
		}
		batch = [];
	}

	try {
		while (true) {
			pageNum++;

			let result;
			try {
				result = await fetchPageWithRetry(accessToken, paginationToken);
			} catch (err) {
				if (err.message === 'AUTH_EXPIRED') {
					accessToken = await api.emergency.tokenManager.getAccessToken('staging-fetch');
					result = await fetchPageWithRetry(accessToken, paginationToken);
				} else {
					throw err;
				}
			}

			const alerts = result.data ?? [];
			totalFetched += alerts.length;
			batch.push(...alerts.map(alertToRow));

			// Flush every 500 rows
			if (batch.length >= UPSERT_BATCH) await flushBatch();

			paginationToken = result.paginationToken ?? null;
			if (!paginationToken || alerts.length === 0) break;

			// Small delay to avoid hammering the API
			await sleep(400);
		}

		// Flush remainder
		await flushBatch();

		await log(
			'alerts.staging.fetch',
			`Fetched ${totalFetched} alerts into staging (${totalUpserted} upserted, ${pageNum} pages)`,
			{ id: locals.profile.id, name: locals.profile.discord_username }
		);

		return json({ success: true, fetched: totalFetched, upserted: totalUpserted, pages: pageNum });
	} catch (err) {
		await flushBatch().catch(() => {});
		await log('alerts.staging.error', err.message || 'Unknown error');
		return json(
			{ error: err.message || 'Fetch failed', fetched: totalFetched, upserted: totalUpserted },
			{ status: 500 }
		);
	}
}
