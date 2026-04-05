import { redirect } from '@sveltejs/kit';

export async function load({ params, fetch }) {
	const handle = params.handle;

	const res = await fetch(`/api/medrunner/profile/${encodeURIComponent(handle)}`);
	const data = await res.json();

	// Handle renamed players — redirect to their current handle
	if (data.redirect) {
		redirect(302, `/medrunner/${encodeURIComponent(data.redirect)}`);
	}

	return {
		handle,
		profile: res.ok ? data.profile : null,
		notFound: res.status === 404
	};
}
