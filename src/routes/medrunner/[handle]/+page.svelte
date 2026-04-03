<script>
	import { MEDRUNNER_ROLES } from '$lib/data/roles.js';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import BadgeIcon from '$lib/components/BadgeIcon.svelte';

	let { data } = $props();
	let profileOverride = $state(null);
	const profile = $derived(profileOverride ?? data.profile);
	let updating = $state(false);
	let error = $state(null);
	let buildingNew = $state(false);

	const threatLabels = { 0: 'Unknown', 1: 'None', 2: 'PvE', 3: 'PvP' };
	const threatBarColors = { '0': 'bg-gray-500', '1': 'bg-green-500', '2': 'bg-yellow-500', '3': 'bg-red-500' };

	function formatTimestamp(ts) {
		if (!ts) return '-';
		let date;
		if (ts > 1e16) date = new Date((ts - 621355968000000000) / 10000);
		else if (ts > 1e12) date = new Date(ts);
		else date = new Date(ts * 1000);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function formatDuration(seconds) {
		if (!seconds) return '-';
		if (seconds < 60) return `${Math.round(seconds)}s`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
		return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
	}

	function formatTotalTime(seconds) {
		if (!seconds) return '-';
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours >= 24) {
			const days = Math.floor(hours / 24);
			const remHours = hours % 24;
			return `${days}d ${remHours}h ${minutes}m`;
		}
		return `${hours}h ${minutes}m`;
	}

	const successRate = $derived(() => {
		if (!profile) return 0;
		const completed = profile.successful_alerts + profile.failed_alerts;
		if (completed === 0) return 0;
		return Math.round((profile.successful_alerts / completed) * 100);
	});

	const primaryRole = $derived(() => {
		if (!profile?.role_distribution) return null;
		const entries = Object.entries(profile.role_distribution);
		if (entries.length === 0) return null;
		const [roleId, count] = entries.sort(([, a], [, b]) => b - a)[0];
		return { ...MEDRUNNER_ROLES[roleId], id: roleId, count };
	});

	const sortedRoles = $derived(() => {
		if (!profile?.role_distribution) return [];
		return Object.entries(profile.role_distribution)
			.map(([id, count]) => ({ id, count, ...(MEDRUNNER_ROLES[id] || { name: 'Unknown', abbreviation: '???' }) }))
			.sort((a, b) => b.count - a.count);
	});

	const sortedSystems = $derived(() => {
		if (!profile?.systems_visited) return [];
		return Object.entries(profile.systems_visited)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);
	});

	const sortedThreats = $derived(() => {
		if (!profile?.threat_level_distribution) return [];
		return Object.entries(profile.threat_level_distribution)
			.map(([level, count]) => ({ level, count, label: threatLabels[level] || level }))
			.sort((a, b) => b.count - a.count);
	});

	const outcomeTotal = $derived(() => profile?.total_alerts || 1);
	const otherAlerts = $derived(() => {
		if (!profile) return 0;
		return outcomeTotal() - profile.successful_alerts - profile.cancelled_alerts - profile.failed_alerts;
	});

	async function refreshProfile() {
		updating = true;
		error = null;
		try {
			const res = await fetch(`/api/medrunner/profile/${encodeURIComponent(data.handle)}`, { method: 'POST' });
			const result = await res.json();
			if (res.ok) {
				profileOverride = result.profile;
			} else {
				error = result.error || 'Failed to update profile';
			}
		} catch (e) {
			error = 'Network error';
		}
		updating = false;
		buildingNew = false;
	}

	// If profile doesn't exist yet, auto-create it
	$effect(() => {
		if (data.notFound && !profile && !updating && !buildingNew) {
			buildingNew = true;
			refreshProfile();
		}
	});
</script>

<svelte:head>
	<title>{profile?.rsi_handle || data.handle} Profile - Med-Tools</title>
</svelte:head>

<div class="h-full overflow-y-auto">
	<div class="mx-auto max-w-5xl p-6">

		{#if (updating || buildingNew) && !profile}
			<!-- Full-page loading animation for first-time profile creation -->
			<div class="flex flex-col items-center justify-center py-32">
				<div class="relative mb-6">
					<div class="h-20 w-20 animate-spin rounded-full border-4 border-gray-700 border-t-primary-500"></div>
					<div class="absolute inset-0 flex items-center justify-center">
						<svg class="h-8 w-8 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
					</div>
				</div>
				<h2 class="font-Mohave text-2xl font-bold text-white">Building Profile</h2>
				<p class="mt-2 text-sm text-gray-400">Analyzing alert history for <span class="text-white font-medium">{data.handle}</span>...</p>
				<div class="mt-4 flex items-center gap-2 text-xs text-gray-500">
					<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500"></div>
					Computing stats from completed alerts
				</div>
			</div>
		{:else if !profile && !updating}
			<div class="py-20 text-center">
				<svg class="mx-auto mb-4 h-12 w-12 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
				<p class="text-lg text-gray-400">No data found for <span class="font-semibold text-white">{data.handle}</span></p>
				<p class="mt-2 text-sm text-gray-500">This person hasn't participated in any alerts.</p>
				<a href="/medrunner" class="btn btn-secondary mt-6 inline-block text-sm">← Back to Profiles</a>
			</div>
		{:else if profile}

			<!-- Update overlay -->
			{#if updating}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
					<div class="flex flex-col items-center rounded-xl border border-gray-700 bg-gray-800 px-10 py-8 shadow-2xl">
						<div class="relative mb-4">
							<div class="h-14 w-14 animate-spin rounded-full border-4 border-gray-600 border-t-primary-500"></div>
							<div class="absolute inset-0 flex items-center justify-center">
								<svg class="h-6 w-6 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
							</div>
						</div>
						<p class="font-Mohave text-lg font-bold text-white">Updating Stats...</p>
						<p class="mt-1 text-xs text-gray-400">Recalculating from alert history</p>
					</div>
				</div>
			{/if}

			<!-- Profile Header -->
			<div class="mb-8 flex flex-col items-center gap-6 rounded-xl border border-gray-700 bg-gray-800/50 p-8 sm:flex-row sm:items-start">
				<!-- Avatar -->
				<div class="relative flex-shrink-0">
					{#if profile.site_avatar}
						<img
							src={profile.site_avatar}
							alt=""
							class="h-24 w-24 rounded-full border-2 border-gray-600 object-cover"
						/>
					{:else}
						<div class="flex h-24 w-24 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-700 text-3xl font-bold text-gray-400">
							{(profile.rsi_handle || data.handle || '?').charAt(0).toUpperCase()}
						</div>
					{/if}
					{#if primaryRole()}
						<div class="absolute -bottom-1 -right-1 rounded-full border-2 border-gray-800 bg-primary-600 px-2 py-0.5 text-xs font-bold text-white">
							{primaryRole().abbreviation}
						</div>
					{/if}
				</div>

				<!-- Name & Quick Stats -->
				<div class="flex-1 text-center sm:text-left">
					<h1 class="font-Mohave text-3xl font-bold text-white">
						{profile.rsi_handle || data.handle}
					</h1>
					{#if profile.discord_username && profile.rsi_handle !== profile.discord_username}
						<p class="text-sm text-gray-400">{profile.discord_username}</p>
					{/if}
					<div class="mt-3 flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
						<div class="flex items-center gap-1.5 text-gray-300">
							<svg class="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
							<span class="font-semibold text-white">{profile.total_alerts}</span> alerts
						</div>
						<div class="flex items-center gap-1.5 text-gray-300">
							<svg class="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
							<span class="font-semibold text-green-400">{successRate()}%</span> success
						</div>
						{#if profile.average_rating}
							<div class="flex items-center gap-1.5 text-gray-300">
								<svg class="h-4 w-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
								<span class="font-semibold text-yellow-400">{profile.average_rating.toFixed(1)}</span> avg rating
							</div>
						{/if}
						<div class="flex items-center gap-1.5 text-gray-300">
							<svg class="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
							since {formatTimestamp(profile.first_alert_timestamp)}
						</div>
						{#if profile.last_alert_timestamp}
							<div class="flex items-center gap-1.5 text-gray-300">
								<svg class="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
								last alert {formatTimestamp(profile.last_alert_timestamp)}
							</div>
						{/if}
					</div>
				</div>

				<!-- Update Button -->
				<div class="flex-shrink-0">
					<button
						class="btn btn-primary text-sm"
						onclick={refreshProfile}
						disabled={updating}
					>
						{#if updating}
							<svg class="mr-1.5 inline h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
							</svg>
							Updating...
						{:else}
							↻ Update Stats
						{/if}
					</button>
					{#if profile.updated_at}
						<p class="mt-1 text-center text-[10px] text-gray-500">
							Updated {new Date(profile.updated_at).toLocaleDateString()}
						</p>
					{/if}
				</div>
			</div>

			{#if error}
				<div class="mb-6 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
					{error}
				</div>
			{/if}

			<!-- Badges -->
			{#if profile.badges?.length > 0}
				<div class="mb-8">
					<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Badges</h2>
					<div class="flex flex-wrap gap-3">
						{#each profile.badges as badge}
							<div
								class="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 transition-colors hover:border-gray-600"
								title={badge.description}
							>
								<BadgeIcon id={badge.id} tier={badge.tier} class="h-5 w-5" />
								<div>
									<p class="text-sm font-semibold text-white">{badge.name}</p>
									<p class="text-[11px] text-gray-400">{badge.description}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Stats Grid -->
			<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<p class="text-xs font-medium uppercase text-gray-400">Total Alerts</p>
					<p class="mt-1 text-2xl font-bold text-white">{profile.total_alerts}</p>
				</div>
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<p class="text-xs font-medium uppercase text-gray-400">Success Rate</p>
					<p class="mt-1 text-2xl font-bold text-green-400">{successRate()}%</p>
					<p class="text-xs text-gray-500">{profile.successful_alerts} of {profile.successful_alerts + profile.failed_alerts} completed</p>
				</div>
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<p class="text-xs font-medium uppercase text-gray-400">Avg Response Time</p>
					<p class="mt-1 text-2xl font-bold text-blue-400">{formatDuration(profile.average_response_time_seconds)}</p>
				</div>
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<p class="text-xs font-medium uppercase text-gray-400">Total Time on Alerts</p>
					<p class="mt-1 text-2xl font-bold text-purple-400">{formatTotalTime(profile.total_time_on_alerts_seconds)}</p>
				</div>
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<p class="text-xs font-medium uppercase text-gray-400">Field / Dispatch</p>
					<p class="mt-1 text-2xl font-bold text-white">{profile.field_count} / {profile.dispatch_count}</p>
				</div>
			</div>

			<!-- Outcome Breakdown -->
			<div class="mb-8">
				<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Alert Outcomes</h2>
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<div class="mb-3 flex h-4 overflow-hidden rounded-full bg-gray-700">
						{#if profile.successful_alerts > 0}
							<div
								class="bg-green-500 transition-all"
								style="width: {(profile.successful_alerts / outcomeTotal()) * 100}%"
								title="Successful: {profile.successful_alerts}"
							></div>
						{/if}
						{#if profile.cancelled_alerts > 0}
							<div
								class="bg-yellow-500 transition-all"
								style="width: {(profile.cancelled_alerts / outcomeTotal()) * 100}%"
								title="Cancelled: {profile.cancelled_alerts}"
							></div>
						{/if}
						{#if profile.failed_alerts > 0}
							<div
								class="bg-red-500 transition-all"
								style="width: {(profile.failed_alerts / outcomeTotal()) * 100}%"
								title="Failed: {profile.failed_alerts}"
							></div>
						{/if}
						{#if otherAlerts() > 0}
							<div
								class="bg-gray-500 transition-all"
								style="width: {(otherAlerts() / outcomeTotal()) * 100}%"
								title="Other: {otherAlerts()}"
							></div>
						{/if}
					</div>
					<div class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
						<span class="flex items-center gap-1.5">
							<span class="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
							<span class="text-gray-300">Success</span>
							<span class="font-semibold text-white">{profile.successful_alerts}</span>
						</span>
						<span class="flex items-center gap-1.5">
							<span class="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
							<span class="text-gray-300">Cancelled</span>
							<span class="font-semibold text-white">{profile.cancelled_alerts}</span>
						</span>
						<span class="flex items-center gap-1.5">
							<span class="inline-block h-2.5 w-2.5 rounded-full bg-red-500"></span>
							<span class="text-gray-300">Failed</span>
							<span class="font-semibold text-white">{profile.failed_alerts}</span>
						</span>
						{#if otherAlerts() > 0}
							<span class="flex items-center gap-1.5">
								<span class="inline-block h-2.5 w-2.5 rounded-full bg-gray-500"></span>
								<span class="text-gray-300">Other</span>
								<span class="font-semibold text-white">{otherAlerts()}</span>
							</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Two Column: Roles & Systems -->
			<div class="mb-8 grid gap-4 lg:grid-cols-2">
				<!-- Role Distribution -->
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Role Distribution</h2>
					{#if sortedRoles().length === 0}
						<p class="text-sm text-gray-500">No role data available</p>
					{:else}
						<div class="space-y-3">
							{#each sortedRoles() as role}
								{@const maxCount = sortedRoles()[0].count}
								<div>
									<div class="mb-1 flex items-center justify-between text-sm">
										<span class="text-gray-200">{role.name}</span>
										<span class="text-gray-400">{role.count} ({Math.round((role.count / profile.total_alerts) * 100)}%)</span>
									</div>
									<div class="h-2 overflow-hidden rounded-full bg-gray-700">
										<div
											class="h-full rounded-full bg-primary-500 transition-all"
											style="width: {(role.count / maxCount) * 100}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Top Systems -->
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Top Systems</h2>
					{#if sortedSystems().length === 0}
						<p class="text-sm text-gray-500">No system data available</p>
					{:else}
						<div class="space-y-3">
							{#each sortedSystems() as sys}
								{@const maxCount = sortedSystems()[0].count}
								<div>
									<div class="mb-1 flex items-center justify-between text-sm">
										<span class="text-gray-200">{sys.name}</span>
										<span class="text-gray-400">{sys.count}</span>
									</div>
									<div class="h-2 overflow-hidden rounded-full bg-gray-700">
										<div
											class="h-full rounded-full bg-blue-500 transition-all"
											style="width: {(sys.count / maxCount) * 100}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Two Column: Threat Levels & Top Partners -->
			<div class="mb-8 grid gap-4 lg:grid-cols-2">
				<!-- Threat Level Distribution -->
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Threat Levels</h2>
					{#if sortedThreats().length === 0}
						<p class="text-sm text-gray-500">No threat data available</p>
					{:else}
						<div class="space-y-3">
							{#each sortedThreats() as threat}
								{@const maxCount = sortedThreats()[0].count}
								<div>
									<div class="mb-1 flex items-center justify-between text-sm">
										<span class="text-gray-200">{threat.label}</span>
										<span class="text-gray-400">{threat.count}</span>
									</div>
									<div class="h-2 overflow-hidden rounded-full bg-gray-700">
										<div
											class="h-full rounded-full transition-all {threatBarColors[threat.level] || 'bg-gray-500'}"
											style="width: {(threat.count / maxCount) * 100}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Top Partners -->
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Top Partners</h2>
					{#if !profile.top_partners?.length}
						<p class="text-sm text-gray-500">No partner data available</p>
					{:else}
						<div class="space-y-2">
							{#each profile.top_partners as partner, i}
								<a
									href="/medrunner/{encodeURIComponent(partner.rsi_handle)}"
									class="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-700/50"
								>
									<div class="flex items-center gap-3">
										<span class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-600 text-xs font-bold text-gray-300">
											{i + 1}
										</span>
										<span class="text-sm text-gray-200">{partner.rsi_handle}</span>
									</div>
									<span class="text-sm text-gray-400">{partner.count} alerts together</span>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Timeline Overview -->
			<div class="mb-8 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
				<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Timeline</h2>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
					<div>
						<p class="text-xs text-gray-500">First Alert</p>
						<p class="text-gray-200">{formatTimestamp(profile.first_alert_timestamp)}</p>
					</div>
					<div>
						<p class="text-xs text-gray-500">Latest Alert</p>
						<p class="text-gray-200">{formatTimestamp(profile.last_alert_timestamp)}</p>
					</div>
					<div>
						<p class="text-xs text-gray-500">Total Time on Alerts</p>
						<p class="text-gray-200">{formatTotalTime(profile.total_time_on_alerts_seconds)}</p>
					</div>
					<div>
						<p class="text-xs text-gray-500">Primary Role</p>
						<p class="text-gray-200">{primaryRole()?.name || 'N/A'}</p>
					</div>
				</div>
			</div>

		{/if}
	</div>
</div>
