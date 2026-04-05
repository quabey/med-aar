export async function load({ fetch, parent }) {
	const { profile } = await parent();

	const [recentRes, myProfileRes] = await Promise.all([
		fetch('/api/medrunner/profiles?limit=10'),
		profile?.discord_id
			? fetch(`/api/medrunner/profile-by-discord?discord_id=${encodeURIComponent(profile.discord_id)}`)
			: Promise.resolve(null)
	]);

	const recentData = await recentRes.json();
	const myHandle = myProfileRes?.ok ? (await myProfileRes.json()).rsi_handle : null;

	return {
		recentProfiles: recentRes.ok ? recentData.profiles : [],
		myHandle
	};
}
