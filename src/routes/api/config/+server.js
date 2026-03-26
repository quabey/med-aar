import { json } from '@sveltejs/kit';
import { verifyPassword } from '$lib/server/auth.js';
import { env } from '$env/dynamic/private';
import defaultAlertTypes from '$lib/config/alertTypes.json';
import defaultShips from '$lib/config/ships.json';
import defaultTemplates from '$lib/config/templates.json';
import defaultLocations from '$lib/AAR/locations.json';

const CONFIG_KEY = 'site-config';

const defaults = {
	alertTypes: defaultAlertTypes,
	ships: defaultShips,
	templates: defaultTemplates,
	locations: defaultLocations
};

export async function GET({ platform }) {
	const kv = platform?.env?.CONFIG_KV;
	if (!kv) return json(defaults);

	try {
		const raw = await kv.get(CONFIG_KEY);
		if (!raw) return json(defaults);
		return json(JSON.parse(raw));
	} catch {
		return json(defaults);
	}
}

export async function PUT({ request, platform }) {
	const kv = platform?.env?.CONFIG_KV;
	const adminPassword = platform?.env?.ADMIN_PASSWORD ?? env.ADMIN_PASSWORD;

	if (!kv || !adminPassword) {
		return json({ error: 'Server not configured' }, { status: 500 });
	}

	const password = request.headers.get('X-Admin-Password');
	if (!password || !(await verifyPassword(password, adminPassword))) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let data;
	try {
		data = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	await kv.put(CONFIG_KEY, JSON.stringify(data));
	return json({ success: true });
}
