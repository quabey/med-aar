import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

function getAdmin() {
	return createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
}

/** GET — return all rsi_handles for the client-side progress loop */
export async function GET({ locals }) {
	if (!locals.profile?.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const supabase = getAdmin();
	const { data, error } = await supabase.from('medrunner_profiles').select('rsi_handle');
	if (error) return json({ error: error.message }, { status: 500 });

	return json({ handles: data.map((p) => p.rsi_handle) });
}
