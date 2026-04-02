import { redirect } from '@sveltejs/kit';

export async function GET(event) {
	const code = event.url.searchParams.get('code');
	const next = event.url.searchParams.get('next') ?? '/';

	if (code) {
		const { data, error } = await event.locals.supabase.auth.exchangeCodeForSession(code);

		if (!error && data.session) {
			// Get the Discord provider token to check guild membership
			const providerToken = data.session.provider_token;

			if (providerToken) {
				// Verify guild membership + role
				const verifyRes = await fetch(`${event.url.origin}/auth/verify`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						providerToken,
						userId: data.session.user.id
					})
				});

				if (!verifyRes.ok) {
					const result = await verifyRes.json();
					// Sign out user if they don't meet requirements
					await event.locals.supabase.auth.signOut();
					throw redirect(303, `/login?error=${encodeURIComponent(result.error || 'Verification failed')}`);
				}
			}

			throw redirect(303, next);
		}
	}

	throw redirect(303, '/login?error=auth_failed');
}
