import { createServerClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * Create a Supabase server client that reads/writes cookies via SvelteKit's event.
 * Use this in hooks.server.js, +layout.server.js, +page.server.js, and +server.js.
 */
export function createSupabaseServerClient(event) {
	return createServerClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});
}
