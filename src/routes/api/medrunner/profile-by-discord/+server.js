import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

export async function GET({ url, locals }) {
	if (!locals.profile?.is_approved) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const discordId = url.searchParams.get('discord_id');
	if (!discordId) {
		return json({ error: 'Missing discord_id' }, { status: 400 });
	}

	const supabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

	const { data, error } = await supabase
		.from('medrunner_profiles')
		.select('rsi_handle')
		.eq('discord_id', discordId)
		.single();

	if (error || !data) {
		return json({ error: 'Profile not found' }, { status: 404 });
	}

	return json({ rsi_handle: data.rsi_handle });
}
