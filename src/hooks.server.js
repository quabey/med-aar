import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error || !user) return { session: null, user: null };

		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		return { session, user };
	};

	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Fetch profile if logged in
	event.locals.profile = null;
	if (user) {
		const { data } = await event.locals.supabase
			.from('profiles')
			.select('id, discord_id, discord_username, discord_avatar, is_approved, is_admin, approval_status')
			.eq('id', user.id)
			.single();
		event.locals.profile = data;
	}

	// Public routes that don't require auth
	const publicRoutes = ['/login', '/auth/callback', '/auth/verify'];
	const isPublic = publicRoutes.some((r) => event.url.pathname.startsWith(r));
	const isApiRoute = event.url.pathname.startsWith('/api/');

	if (!isPublic && !isApiRoute) {
		if (!session) {
			throw redirect(303, '/login');
		}

		if (event.locals.profile && !event.locals.profile.is_approved) {
			if (event.url.pathname !== '/pending') {
				throw redirect(303, '/pending');
			}
		}

		// Redirect approved users away from /pending
		if (event.locals.profile?.is_approved && event.url.pathname === '/pending') {
			throw redirect(303, '/');
		}

		if (event.url.pathname.startsWith('/admin')) {
			if (!event.locals.profile?.is_admin) {
				throw redirect(303, '/');
			}
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
}
