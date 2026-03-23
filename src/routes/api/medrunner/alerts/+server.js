import { json } from '@sveltejs/kit';

const ALERTS_KEY = 'recent-alerts';
const MAX_ALERTS = 100;

export async function GET({ platform }) {
	const kv = platform?.env?.CONFIG_KV;
	if (!kv) return json({ alerts: [] });

	try {
		const raw = await kv.get(ALERTS_KEY);
		if (!raw) return json({ alerts: [] });
		return json({ alerts: JSON.parse(raw) });
	} catch {
		return json({ alerts: [] });
	}
}

export async function POST({ request, platform }) {
	const kv = platform?.env?.CONFIG_KV;
	if (!kv) {
		return json({ error: 'KV not configured' }, { status: 500 });
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
		const raw = await kv.get(ALERTS_KEY);
		const alerts = raw ? JSON.parse(raw) : [];

		// Don't store duplicates
		if (alerts.some((a) => a.id === alert.id)) {
			return json({ success: true, duplicate: true });
		}

		// Store only relevant fields
		const stored = {
			id: alert.id,
			clientRsiHandle: alert.clientRsiHandle || '',
			missionName: alert.missionName || '',
			system: alert.system || '',
			subsystem: alert.subsystem || '',
			tertiaryLocation: alert.tertiaryLocation || '',
			threatLevel: alert.threatLevel ?? 0,
			status: alert.status ?? 0,
			creationTimestamp: alert.creationTimestamp || Date.now(),
			test: alert.test || false,
			storedAt: Date.now()
		};

		alerts.unshift(stored);
		if (alerts.length > MAX_ALERTS) alerts.length = MAX_ALERTS;

		await kv.put(ALERTS_KEY, JSON.stringify(alerts));
		return json({ success: true });
	} catch (err) {
		console.error('Alert store error:', err);
		return json({ error: 'Failed to store alert' }, { status: 500 });
	}
}
