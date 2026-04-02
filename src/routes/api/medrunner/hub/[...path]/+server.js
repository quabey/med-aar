import { MedrunnerApiClient } from '@medrunner/api-client';
import { env } from '$env/dynamic/private';

const API_BASE = 'https://api.medrunner.space';

let cachedApi = null;
let cachedToken = null;

function getApi(token) {
	if (!cachedApi || cachedToken !== token) {
		cachedApi = MedrunnerApiClient.buildClient({ refreshToken: token });
		cachedToken = token;
	}
	return cachedApi;
}

async function proxy({ request, params, url, platform }) {
	const token = platform?.env?.MEDRUNNER_TOKEN ?? env.MEDRUNNER_TOKEN;
	if (!token) return new Response('Not configured', { status: 500 });

	let accessToken;
	try {
		accessToken = await getApi(token).emergency.tokenManager.getAccessToken('hub-proxy');
	} catch {
		cachedApi = null;
		accessToken = await getApi(token).emergency.tokenManager.getAccessToken('hub-proxy');
	}

	const path = params.path || '';
	const targetUrl = `${API_BASE}/hub/emergency${path ? '/' + path : ''}${url.search}`;

	const headers = new Headers();
	headers.set('Authorization', `Bearer ${accessToken}`);

	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('Content-Type', contentType);

	const init = { method: request.method, headers };

	if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'DELETE') {
		init.body = await request.arrayBuffer();
		init.duplex = 'half';
	}

	const response = await fetch(targetUrl, init);

	const respHeaders = new Headers();
	const ct = response.headers.get('content-type');
	if (ct) respHeaders.set('content-type', ct);

	return new Response(response.body, {
		status: response.status,
		headers: respHeaders
	});
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
