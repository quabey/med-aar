/**
 * Import alerts from local PostgreSQL to Supabase completed_alerts table.
 *
 * Usage:
 *   node scripts/import-alerts.mjs
 *
 * Prerequisites:
 *   npm install pg (or: npm install --save-dev pg)
 *
 * Env vars (reads from .env automatically):
 *   PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY — Supabase connection
 *   Local DB is hardcoded: postgresql://postgres:postgres@localhost:5432/medrunner
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith('#')) continue;
	const eqIdx = trimmed.indexOf('=');
	if (eqIdx === -1) continue;
	const key = trimmed.slice(0, eqIdx);
	const value = trimmed.slice(eqIdx + 1);
	if (!process.env[key]) process.env[key] = value;
}

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const LOCAL_DB_URL = 'postgresql://postgres:postgres@localhost:5432/medrunner';
const BATCH_SIZE = 500;

if (!SUPABASE_URL || !SUPABASE_KEY) {
	console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
	process.exit(1);
}

// Use Supabase REST API with service role key to bypass RLS
async function supabaseInsert(rows) {
	const url = `${SUPABASE_URL}/rest/v1/completed_alerts`;
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			apikey: SUPABASE_KEY,
			Authorization: `Bearer ${SUPABASE_KEY}`,
			Prefer: 'resolution=merge-duplicates'
		},
		body: JSON.stringify(rows)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Supabase insert failed (${res.status}): ${text}`);
	}
}

async function main() {
	console.log('Connecting to local PostgreSQL...');
	const localClient = new pg.Client(LOCAL_DB_URL);
	await localClient.connect();

	// Count total
	const countResult = await localClient.query('SELECT count(*) FROM alerts');
	const total = parseInt(countResult.rows[0].count, 10);
	console.log(`Found ${total} alerts to import`);

	let imported = 0;
	let offset = 0;

	while (offset < total) {
		const { rows } = await localClient.query(
			'SELECT * FROM alerts ORDER BY creation_timestamp ASC LIMIT $1 OFFSET $2',
			[BATCH_SIZE, offset]
		);

		if (rows.length === 0) break;

		// Map rows — column names already match the Supabase table
		const mapped = rows.map((r) => ({
			id: r.id,
			system: r.system,
			subsystem: r.subsystem,
			tertiary_location: r.tertiary_location,
			threat_level: r.threat_level,
			client_rsi_handle: r.client_rsi_handle,
			client_discord_id: r.client_discord_id,
			client_id: r.client_id,
			subscription_tier: r.subscription_tier,
			status: r.status,
			cancellation_reason: r.cancellation_reason,
			mission_name: r.mission_name,
			submission_source: r.submission_source,
			origin: r.origin,
			is_complete: r.is_complete,
			test: r.test,
			rating: r.rating,
			rating_remarks: r.rating_remarks,
			creation_timestamp: r.creation_timestamp,
			accepted_timestamp: r.accepted_timestamp,
			completion_timestamp: r.completion_timestamp,
			created_at: r.created_at,
			updated_at: r.updated_at,
			coord_thread_id: r.coord_thread_id,
			coord_channel_id: r.coord_channel_id,
			client_rsi_profile_link: r.client_rsi_profile_link,
			client_got_data: r.client_got_data,
			client_redacted_org: r.client_redacted_org,
			client_reported: r.client_reported,
			client_user_sid: r.client_user_sid,
			aar_services_provided: r.aar_services_provided,
			aar_suspected_trap: r.aar_suspected_trap,
			aar_remarks: r.aar_remarks,
			aar_submitter_staff_id: r.aar_submitter_staff_id,
			aar_submitted_on: r.aar_submitted_on,
			aar_has_been_edited: r.aar_has_been_edited,
			responding_team: r.responding_team,
			responding_teams: r.responding_teams,
			aar_edit_history: r.aar_edit_history,
			raw: r.raw
		}));

		await supabaseInsert(mapped);
		imported += rows.length;
		offset += BATCH_SIZE;
		console.log(`Imported ${imported}/${total} (${((imported / total) * 100).toFixed(1)}%)`);
	}

	await localClient.end();
	console.log(`\nDone! Imported ${imported} alerts to Supabase completed_alerts table.`);
}

main().catch((err) => {
	console.error('Import failed:', err);
	process.exit(1);
});
