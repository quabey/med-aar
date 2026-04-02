import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

export async function GET({ url, locals }) {
	if (!locals.profile?.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
	const offset = parseInt(url.searchParams.get('offset') || '0', 10);

	const supabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

	const { data, error, count } = await supabase
		.from('admin_logs')
		.select('*', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ logs: data || [], total: count || 0 });
}
