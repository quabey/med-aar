import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { sendApprovalWebhook } from '$lib/server/discord-webhook.js';

const GUILD_ID = '730982567972700281';
const REQUIRED_ROLE_ID = '1061421870404079716';

export async function POST({ request }) {
	const { providerToken, userId } = await request.json();

	if (!providerToken || !userId) {
		return json({ error: 'Missing token or user ID' }, { status: 400 });
	}

	// Check guild membership using Discord API
	let member;
	try {
		const res = await fetch(
			`https://discord.com/api/v10/users/@me/guilds/${GUILD_ID}/member`,
			{
				headers: { Authorization: `Bearer ${providerToken}` }
			}
		);

		if (res.status === 404 || res.status === 403) {
			return json(
				{ error: 'You must be a member of the Medrunner Discord server.' },
				{ status: 403 }
			);
		}

		if (!res.ok) {
			const text = await res.text();
			console.error('Discord guild check failed:', res.status, text);
			return json({ error: 'Failed to verify Discord membership.' }, { status: 502 });
		}

		member = await res.json();
	} catch (err) {
		console.error('Discord API error:', err);
		return json({ error: 'Failed to contact Discord.' }, { status: 502 });
	}

	// Check required role
	const hasRole = member.roles?.includes(REQUIRED_ROLE_ID);
	if (!hasRole) {
		return json(
			{ error: 'You do not have the required role in the Medrunner Discord server.' },
			{ status: 403 }
		);
	}

	// User is verified — update profile using service role client
	const supabaseAdmin = createClient(
		PUBLIC_SUPABASE_URL,
		env.SUPABASE_SECRET_KEY
	);

	// Check if profile already exists and is approved
	const { data: existing } = await supabaseAdmin
		.from('profiles')
		.select('id, is_approved, approval_status')
		.eq('id', userId)
		.single();

	if (existing?.is_approved) {
		// Already approved, nothing to do
		return json({ ok: true, status: 'approved' });
	}

	if (!existing || existing.approval_status === 'rejected') {
		// New user or previously rejected — check if first user (auto-admin)
		const { count } = await supabaseAdmin
			.from('profiles')
			.select('*', { count: 'exact', head: true });

		const isFirstUser = (count || 0) === 0;

		const discordUser = member.user || {};
		await supabaseAdmin
			.from('profiles')
			.upsert({
				id: userId,
				discord_id: discordUser.id || '',
				discord_username: discordUser.global_name || discordUser.username || '',
				discord_avatar: discordUser.avatar
					? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
					: null,
				approval_status: isFirstUser ? 'approved' : 'pending',
				is_approved: isFirstUser,
				is_admin: isFirstUser
			}, { onConflict: 'id' });

		if (!isFirstUser) {
			// Send Discord webhook notification for non-first users
			await sendApprovalWebhook({
				username: discordUser.global_name || discordUser.username || 'Unknown',
				discordId: discordUser.id || '',
				avatar: discordUser.avatar
			});
		}

		return json({ ok: true, status: isFirstUser ? 'approved' : 'pending' });
	}

	// Pending — just acknowledge
	return json({ ok: true, status: existing.approval_status });
}
