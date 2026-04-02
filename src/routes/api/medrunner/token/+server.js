import { json } from '@sveltejs/kit';
import { MedrunnerApiClient } from '@medrunner/api-client';
import { env } from '$env/dynamic/private';

export async function GET({ platform, locals }) {
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const token = platform?.env?.MEDRUNNER_TOKEN ?? env.MEDRUNNER_TOKEN;
	if (!token) {
		return json({ error: 'Medrunner API token not configured' }, { status: 500 });
	}

	try {
		const api = MedrunnerApiClient.buildClient({ refreshToken: token });
		const accessToken = await api.emergency.tokenManager.getAccessToken('ws-token');

		if (!accessToken) {
			return json({ error: 'Failed to obtain access token' }, { status: 401 });
		}

		return json({ accessToken });
	} catch (err) {
		console.error('Token fetch error:', err);
		return json({ error: 'Failed to get token' }, { status: 502 });
	}
}
