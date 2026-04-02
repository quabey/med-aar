import { json } from '@sveltejs/kit';
import { log } from '$lib/server/logger.js';

export async function POST({ request, locals }) {
	if (!locals.profile?.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const { action, details } = await request.json();
	if (!action) {
		return json({ error: 'action required' }, { status: 400 });
	}

	await log(action, details || null, {
		id: locals.profile.id,
		name: locals.profile.discord_username
	});

	return json({ ok: true });
}
