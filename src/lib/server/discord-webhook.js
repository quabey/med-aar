import { env } from '$env/dynamic/private';

export async function sendApprovalWebhook(user) {
	const webhookUrl = env.DISCORD_WEBHOOK_URL;
	if (!webhookUrl) {
		console.warn('DISCORD_WEBHOOK_URL not configured, skipping webhook');
		return;
	}

	const username = user.username || 'Unknown';
	const discordId = user.discordId || 'Unknown';

	const embed = {
		title: 'New User Awaiting Approval',
		color: 0xf59e0b,
		thumbnail: user.avatar && user.discordId
			? { url: `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=128` }
			: undefined,
		fields: [
			{ name: 'Username', value: username, inline: true },
			{ name: 'Discord ID', value: discordId, inline: true }
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
			console.error('Discord webhook error:', res.status, text);
		}
	} catch (err) {
		console.error('Failed to send Discord webhook:', err);
	}
}
