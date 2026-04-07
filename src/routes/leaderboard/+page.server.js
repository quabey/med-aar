export async function load({ fetch }) {
	const res = await fetch('/api/medrunner/leaderboard');
	const data = await res.json();

	return {
		leaderboards: res.ok ? data.leaderboards : {},
		monthly: res.ok ? (data.monthly ?? {}) : {},
		weekly: res.ok ? (data.weekly ?? {}) : {},
		totalProfiles: data.total_profiles || 0
	};
}
