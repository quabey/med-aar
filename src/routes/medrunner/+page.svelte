<script>
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import BadgeIcon from '$lib/components/BadgeIcon.svelte';

	let { data } = $props();
	let searchResults = $state(null);
	const profiles = $derived(searchResults ?? data.recentProfiles ?? []);
	let searchQuery = $state('');
	let searching = $state(false);
	let searched = $state(false);

	function formatTimestamp(ts) {
		if (!ts) return '-';
		let date;
		if (ts > 1e16) date = new Date((ts - 621355968000000000) / 10000);
		else if (ts > 1e12) date = new Date(ts);
		else date = new Date(ts * 1000);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function formatTotalTime(seconds) {
		if (!seconds) return '-';
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours >= 24) {
			const days = Math.floor(hours / 24);
			const remHours = hours % 24;
			return `${days}d ${remHours}h`;
		}
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}

	function successRate(profile) {
		const completed = profile.successful_alerts + profile.failed_alerts;
		if (completed === 0) return 0;
		return Math.round((profile.successful_alerts / completed) * 100);
	}

	async function handleSearch() {
		const q = searchQuery.trim();
		if (!q) {
			// Reset to recent
			searched = false;
			searchResults = null;
			return;
		}
		searching = true;
		searched = true;
		try {
			const res = await fetch(`/api/medrunner/profiles?search=${encodeURIComponent(q)}&limit=20`);
			const result = await res.json();
			searchResults = res.ok ? result.profiles : [];
		} catch {
			searchResults = [];
		}
		searching = false;
	}

	function handleKeydown(e) {
		if (e.key === 'Enter') handleSearch();
	}

	function goToProfile() {
		const q = searchQuery.trim();
		if (q) {
			window.location.href = `/medrunner/${encodeURIComponent(q)}`;
		}
	}
</script>

<svelte:head>
	<title>Medrunner Profiles - Med-Tools</title>
</svelte:head>

<div class="h-full overflow-y-auto">
	<div class="mx-auto max-w-5xl p-6">

		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="font-Mohave text-3xl font-bold text-white">Medrunner Profiles</h1>
				<p class="mt-1 text-sm text-gray-400">View stats and history for medrunners</p>
			</div>
			{#if data.myHandle}
				<a
					href="/medrunner/{encodeURIComponent(data.myHandle)}"
					class="btn btn-primary flex items-center gap-2 text-sm"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
					My Profile
				</a>
			{/if}
		</div>

		<!-- Search -->
		<div class="mb-8 flex gap-3">
			<div class="relative flex-1">
				<input
					type="text"
					bind:value={searchQuery}
					onkeydown={handleKeydown}
					placeholder="Search by RSI handle..."
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 pl-10 text-sm text-gray-200 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
				/>
				<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>
			<button
				class="btn btn-primary text-sm"
				onclick={handleSearch}
				disabled={searching}
			>
				{searching ? 'Searching...' : 'Search'}
			</button>
			<button
				class="btn btn-secondary text-sm"
				onclick={goToProfile}
				disabled={!searchQuery.trim()}
				title="Go directly to this handle's profile"
			>
				Go to Profile →
			</button>
		</div>

		<!-- Section Label -->
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-medium text-gray-400">
				{#if searched}
					Search Results
				{:else}
					Recently Active Medrunners
				{/if}
			</h2>
			{#if searched}
				<button
					class="text-xs text-gray-500 hover:text-gray-300"
					onclick={() => { searchQuery = ''; searched = false; searchResults = null; }}
				>
					← Back to recent
				</button>
			{/if}
		</div>

		<!-- Profiles List -->
		{#if searching}
			<div class="flex justify-center py-12">
				<LoadingSpinner message="Searching..." />
			</div>
		{:else if profiles.length === 0}
			<div class="py-12 text-center">
				<svg class="mx-auto mb-3 h-10 w-10 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
				{#if searched}
					<p class="text-gray-400">No medrunners found matching "<span class="text-white">{searchQuery}</span>"</p>
					<p class="mt-2 text-sm text-gray-500">Try searching for an exact RSI handle, or use "Go to Profile" to look up directly.</p>
				{:else}
					<p class="text-gray-400">No medrunner profiles yet.</p>
					<p class="mt-2 text-sm text-gray-500">Profiles are created when visiting a medrunner's profile page.</p>
				{/if}
			</div>
		{:else}
			<div class="space-y-3">
				{#each profiles as profile}
					<a
						href="/medrunner/{encodeURIComponent(profile.rsi_handle)}"
						class="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4 transition-colors hover:border-gray-600 hover:bg-gray-800"
					>
						<!-- Avatar placeholder -->
						<div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 text-lg font-bold text-gray-400">
							{(profile.rsi_handle || '?').charAt(0).toUpperCase()}
						</div>

						<!-- Info -->
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-base font-semibold text-white">{profile.rsi_handle}</span>
								{#if profile.badges?.length > 0}
									<span title={profile.badges[0].name}>
										<BadgeIcon id={profile.badges[0].id} tier={profile.badges[0].tier} class="h-4 w-4" />
									</span>
								{/if}
							</div>
							{#if profile.discord_username && profile.discord_username !== profile.rsi_handle}
								<p class="text-xs text-gray-500">{profile.discord_username}</p>
							{/if}
						</div>

						<!-- Stats -->
						<div class="hidden items-center gap-6 text-sm sm:flex">
							<div class="text-center">
								<p class="font-semibold text-white">{profile.total_alerts}</p>
								<p class="text-[10px] text-gray-500">alerts</p>
							</div>
							<div class="text-center">
								<p class="font-semibold text-green-400">{successRate(profile)}%</p>
								<p class="text-[10px] text-gray-500">success</p>
							</div>
							{#if profile.average_rating}
								<div class="text-center">
									<p class="font-semibold text-yellow-400">{profile.average_rating.toFixed(1)}</p>
									<p class="text-[10px] text-gray-500">rating</p>
								</div>
							{/if}
							<div class="text-center">
								<p class="font-semibold text-purple-400">{formatTotalTime(profile.total_time_on_alerts_seconds)}</p>
								<p class="text-[10px] text-gray-500">time</p>
							</div>
							<div class="text-right">
								<p class="text-xs text-gray-400">{formatTimestamp(profile.last_alert_timestamp)}</p>
								<p class="text-[10px] text-gray-500">last active</p>
							</div>
						</div>

						<!-- Mobile stats -->
						<div class="flex items-center gap-3 text-xs sm:hidden">
							<span class="text-white">{profile.total_alerts} alerts</span>
							<span class="text-green-400">{successRate(profile)}%</span>
						</div>

						<!-- Arrow -->
						<svg class="h-4 w-4 flex-shrink-0 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
				{/each}
			</div>
		{/if}

	</div>
</div>
