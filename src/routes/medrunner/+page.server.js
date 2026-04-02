export async function load({ fetch }) {
	const res = await fetch('/api/medrunner/profiles?limit=10');
	const data = await res.json();

	return {
		recentProfiles: res.ok ? data.profiles : []
	};
}
