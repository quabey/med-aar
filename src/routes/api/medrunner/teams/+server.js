import { json } from '@sveltejs/kit';
import { MedrunnerApiClient } from '@medrunner/api-client';
import { env } from '$env/dynamic/private';

const API_BASE = 'https://api.medrunner.space';

export async function GET() {
	const token = env.MEDRUNNER_TOKEN;
	if (!token) {
		return json({ error: 'Medrunner API token not configured' }, { status: 500 });
	}

	try {
		// Use the library to authenticate and obtain an access token
		const api = MedrunnerApiClient.buildClient({ refreshToken: token });
		const accessToken = await api.emergency.tokenManager.getAccessToken('teams-fetch');

		if (!accessToken) {
			return json({ error: 'Failed to obtain access token' }, { status: 401 });
		}

		// Call the active teams endpoint directly
		const res = await fetch(`${API_BASE}/team/active`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});

		if (!res.ok) {
			const text = await res.text().catch(() => '');
			console.error('Medrunner API error:', res.status, text);
			return json({ error: `API returned ${res.status}` }, { status: 502 });
		}

		const data = await res.json();
		return json({ data: data.data ?? data });
	} catch (err) {
		console.error('Medrunner teams fetch error:', err);
		return json({ error: err.message || 'Failed to fetch active teams' }, { status: 502 });
	}
}
