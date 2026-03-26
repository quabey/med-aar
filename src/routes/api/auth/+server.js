import { json } from '@sveltejs/kit';
import { verifyPassword } from '$lib/server/auth.js';
import { env } from '$env/dynamic/private';

export async function POST({ request, platform }) {
	const adminPassword = platform?.env?.ADMIN_PASSWORD ?? env.ADMIN_PASSWORD;
	if (!adminPassword) {
		return json({ error: 'Server not configured' }, { status: 500 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	const { password } = body;
	if (!password || !(await verifyPassword(password, adminPassword))) {
		return json({ success: false }, { status: 401 });
	}

	return json({ success: true });
}
