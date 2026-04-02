import { env } from '$env/dynamic/private';

export async function sendApprovalWebhook(user) {
	const webhookUrl = env.DISCORD_WEBHOOK_URL;
	if (!webhookUrl) {
		console.warn('DISCORD_WEBHOOK_URL not configured, skipping webhook');
		return;
	}

	const embed = {
		title: 'New User Awaiting Approval',
		color: 0xf59e0b,
		thumbnail: user.avatar
			? { url: `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=128` }
			: undefined,
		fields: [
			{ name: 'Username', value: user.username, inline: true },
			{ name: 'Discord ID', value: user.discordId, inline: true }
		],
		timestamp: new Date().toISOString()
	};

	try {
		await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: '<@309333315738009610>', embeds: [embed] })
		});
	} catch (err) {
		console.error('Failed to send Discord webhook:', err);
	}
}
