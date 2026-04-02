import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

export async function GET({ url, locals }) {
	if (!locals.profile?.is_approved) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const search = url.searchParams.get('search')?.trim();
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);

	const supabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);

	if (search) {
		// Exact (case-insensitive) match search
		const { data, error } = await supabase
			.from('medrunner_profiles')
			.select('rsi_handle, discord_username, total_alerts, successful_alerts, failed_alerts, average_rating, last_alert_timestamp, badges, average_response_time_seconds, total_time_on_alerts_seconds')
			.ilike('rsi_handle', `%${search}%`)
			.order('total_alerts', { ascending: false })
			.limit(limit);

		if (error) {
			return json({ error: error.message }, { status: 500 });
		}

		return json({ profiles: data || [] });
	}

	// Default: recent medrunners by last alert
	const { data, error } = await supabase
		.from('medrunner_profiles')
		.select('rsi_handle, discord_username, total_alerts, successful_alerts, failed_alerts, average_rating, last_alert_timestamp, badges, average_response_time_seconds, total_time_on_alerts_seconds')
		.order('last_alert_timestamp', { ascending: false, nullsFirst: false })
		.limit(limit);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ profiles: data || [] });
}
