import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

function getAdmin() {
	return createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
}

/**
 * Insert a log entry into admin_logs using the service role.
 * @param {string} action - Short action label (e.g. 'user.signup', 'alerts.sync')
 * @param {string} [details] - Human-readable details
 * @param {{ id?: string, name?: string }} [actor] - Who performed the action
 */
export async function log(action, details, actor) {
	try {
		await getAdmin().from('admin_logs').insert({
			action,
			details: details || null,
			actor_id: actor?.id || null,
			actor_name: actor?.name || 'System'
		});
	} catch (err) {
		console.error('Failed to write admin log:', err);
	}
}
