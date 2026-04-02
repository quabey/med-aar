import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { log } from '$lib/server/logger.js';

export async function POST({ locals }) {
	if (!locals.profile?.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const webhookUrl = env.DISCORD_WEBHOOK_URL;
	if (!webhookUrl) {
		return json({ error: 'DISCORD_WEBHOOK_URL not configured' }, { status: 500 });
	}

	const embed = {
		title: 'Webhook Test',
		description: 'This is a test message from the Med-Tools admin panel.',
		color: 0x22c55e,
		fields: [
			{ name: 'Triggered by', value: locals.profile.discord_username || 'Unknown', inline: true }
		],
		timestamp: new Date().toISOString()
	};

	try {
		const res = await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ embeds: [embed] })
		});
		if (!res.ok) {
			const text = await res.text().catch(() => '');
			return json({ error: `Discord returned ${res.status}: ${text}` }, { status: 502 });
		}
		await log('webhook.test', 'Test webhook sent successfully', { id: locals.profile.id, name: locals.profile.discord_username });
		return json({ success: true });
	} catch (err) {
		return json({ error: err.message || 'Failed to send webhook' }, { status: 500 });
	}
}
