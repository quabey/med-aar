export async function load({ params, fetch }) {
	const handle = params.handle;

	const res = await fetch(`/api/medrunner/profile/${encodeURIComponent(handle)}`);
	const data = await res.json();

	return {
		handle,
		profile: res.ok ? data.profile : null,
		notFound: res.status === 404
	};
}
