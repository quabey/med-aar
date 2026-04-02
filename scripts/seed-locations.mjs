/**
 * Seed the locations table from the locations.json file.
 *
 * Usage:
 *   node scripts/seed-locations.mjs
 *
 * Run AFTER migration 003_ships_templates_locations.sql
 */

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
const BATCH_SIZE = 500;

if (!SUPABASE_URL || !SUPABASE_KEY) {
	console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
	process.exit(1);
}

async function supabasePost(table, rows) {
	const url = `${SUPABASE_URL}/rest/v1/${table}`;
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
		throw new Error(`Insert into ${table} failed (${res.status}): ${text}`);
	}
}

async function main() {
	const locationsPath = resolve(__dirname, '..', 'src', 'lib', 'AAR', 'locations.json');
	const locations = JSON.parse(readFileSync(locationsPath, 'utf-8'));

	console.log(`Seeding ${locations.length} locations...`);

	for (let i = 0; i < locations.length; i += BATCH_SIZE) {
		const batch = locations.slice(i, i + BATCH_SIZE).map((loc, idx) => ({
			name: loc.name,
			type: loc.type || '',
			planetary_body: loc.planetaryBody || '',
			sort_order: i + idx
		}));
		await supabasePost('locations', batch);
		console.log(`  ${Math.min(i + BATCH_SIZE, locations.length)}/${locations.length}`);
	}

	console.log('Done! Locations seeded.');
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
