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
	let buildFailed = $state(false);

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

	const fieldOutcomeTotal = $derived(() => profile?.field_total_alerts || 1);
	const fieldSuccessful = $derived(() => profile?.field_successful_alerts || 0);
	const fieldCancelled = $derived(() => profile?.field_cancelled_alerts || 0);
	const fieldFailed = $derived(() => profile?.field_failed_alerts || 0);
	const fieldAborted = $derived(() => profile?.field_aborted_alerts || 0);
	const fieldNoContact = $derived(() => profile?.field_no_contact_alerts || 0);
	const fieldRefused = $derived(() => profile?.field_refused_alerts || 0);
	const fieldServerError = $derived(() => profile?.field_server_error_alerts || 0);

	// Build embed description from server-loaded profile data
	const embedDescription = $derived(() => {
		const p = data.profile;
		if (!p) return `Medrunner profile for ${data.handle}`;
		const lines = [];

		// Line 1: Core stats
		const core = [];
		core.push(`${p.total_alerts} alerts`);
		const completed = p.successful_alerts + p.failed_alerts;
		if (completed > 0) core.push(`${Math.round((p.successful_alerts / completed) * 100)}% success rate`);
		if (p.average_rating) core.push(`${p.average_rating.toFixed(1)}★ rating`);
		lines.push(core.join(' · '));

		// Line 2: Response & time
		const time = [];
		if (p.average_response_time_seconds) {
			const s = p.average_response_time_seconds;
			time.push(`Avg response: ${s < 60 ? Math.round(s) + 's' : Math.floor(s / 60) + 'm ' + Math.round(s % 60) + 's'}`);
		}
		if (p.total_time_on_alerts_seconds) {
			const h = Math.floor(p.total_time_on_alerts_seconds / 3600);
			time.push(`${h}h total time`);
		}
		if (time.length) lines.push(time.join(' · '));

		// Line 3: Role & activity
		const info = [];
		if (p.role_distribution) {
			const topRole = Object.entries(p.role_distribution).sort(([, a], [, b]) => b - a)[0];
			if (topRole) {
				const role = MEDRUNNER_ROLES[topRole[0]];
				if (role) info.push(role.name);
			}
		}
		if (p.field_count && p.dispatch_count) info.push(`${p.field_count} field / ${p.dispatch_count} dispatch`);
		else if (p.field_count) info.push(`${p.field_count} field ops`);
		else if (p.dispatch_count) info.push(`${p.dispatch_count} dispatch ops`);
		if (p.badges?.length) info.push(`${p.badges.length} badge${p.badges.length !== 1 ? 's' : ''}`);
		if (info.length) lines.push(info.join(' · '));

		return lines.join('\n');
	});

	async function refreshProfile() {
		updating = true;
		error = null;
		buildFailed = false;
		try {
			const res = await fetch(`/api/medrunner/profile/${encodeURIComponent(data.handle)}`, { method: 'POST' });
			const result = await res.json();
			if (res.ok) {
				// If the user changed their RSI handle, redirect to the new profile URL
				if (result.redirect) {
					window.location.href = `/medrunner/${encodeURIComponent(result.redirect)}`;
					return;
				}
				profileOverride = result.profile;
			} else {
				error = result.error || 'Failed to update profile';
				buildFailed = true;
			}
		} catch (e) {
			error = 'Network error';
			buildFailed = true;
		}
		updating = false;
		buildingNew = false;
	}

	// If profile doesn't exist yet, auto-create it (once)
	$effect(() => {
		if (data.notFound && !profile && !updating && !buildingNew && !buildFailed) {
			buildingNew = true;
			refreshProfile();
		}
	});
</script>

<svelte:head>
	<title>{profile?.rsi_handle || data.handle} Profile - Med-Tools</title>
	<meta property="og:title" content={`${profile?.rsi_handle || data.handle} — Medrunner Profile`} />
	<meta property="og:type" content="profile" />
	<meta property="og:url" content={`https://med-tools.space/medrunner/${encodeURIComponent(data.handle)}`} />
	<meta property="og:description" content={embedDescription()} />
	<meta property="og:image" content="https://med-tools.space/medtools-og.png" />
	<meta property="profile:username" content={profile?.rsi_handle || data.handle} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={`${profile?.rsi_handle || data.handle} — Medrunner Profile`} />
	<meta name="twitter:description" content={embedDescription()} />
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
				{#if buildFailed}
					<svg class="mx-auto mb-4 h-12 w-12 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
					<p class="text-lg text-red-400">Profile can't be found</p>
					<p class="mt-2 text-sm text-gray-400">Make sure the spelling is correct, including capitalization.</p>
					{#if error}
						<p class="mt-1 text-xs text-gray-500">{error}</p>
					{/if}
					<div class="mt-6 flex justify-center gap-3">
						<button class="btn btn-primary text-sm" onclick={() => { buildFailed = false; buildingNew = false; refreshProfile(); }}>
							Try Again
						</button>
						<a href="/medrunner" class="btn btn-secondary text-sm">← Back to Profiles</a>
					</div>
				{:else}
					<svg class="mx-auto mb-4 h-12 w-12 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
					<p class="text-lg text-gray-400">No data found for <span class="font-semibold text-white">{data.handle}</span></p>
					<p class="mt-2 text-sm text-gray-500">This person hasn't participated in any alerts.</p>
					<a href="/medrunner" class="btn btn-secondary mt-6 inline-block text-sm">← Back to Profiles</a>
				{/if}
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
				{@const sortedBadges = [...profile.badges].sort((a, b) => b.tier - a.tier)}
				{@const featuredBadges = sortedBadges.filter(b => b.tier >= 4)}
				{@const regularBadges = sortedBadges.filter(b => b.tier < 4)}
				<div class="mb-8">
					<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Badges <span class="ml-1 text-base font-normal text-gray-500">({profile.badges.length})</span></h2>

					{#if featuredBadges.length > 0}
						<div class="mb-3 flex flex-wrap gap-3">
							{#each featuredBadges as badge}
								<div
									class="badge-card badge-tier-{badge.tier} flex items-center gap-2.5 rounded-lg border px-4 py-3 transition-all"
									title={badge.description}
								>
									<BadgeIcon id={badge.id} tier={badge.tier} class="h-6 w-6 flex-shrink-0" />
									<div>
										<p class="text-sm font-bold text-white">{badge.name}</p>
										<p class="text-[10px] text-gray-400">{badge.description}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{#if regularBadges.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each regularBadges as badge}
								<div
									class="badge-card badge-tier-{badge.tier} flex items-center gap-2 rounded-lg border px-3 py-2 transition-all"
									title={badge.description}
								>
									<BadgeIcon id={badge.id} tier={badge.tier} class="h-4 w-4 flex-shrink-0" />
									<div>
										<p class="text-xs font-semibold text-white">{badge.name}</p>
										<p class="text-[10px] text-gray-400">{badge.description}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
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
						<p class="text-xs font-medium uppercase text-gray-400">Avg Alert Duration</p>
						<p class="mt-1 text-2xl font-bold text-amber-400">{formatDuration(profile.average_alert_duration_seconds)}</p>
						<p class="mt-1 text-xs text-gray-500">longest {formatDuration(profile.longest_alert_duration_seconds)}</p>
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

			<!-- Outcome Breakdown (field missions only) -->
			<div class="mb-8">
				<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Alert Outcomes <span class="text-sm font-normal text-gray-400">field missions only</span></h2>
				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<div class="mb-3 flex h-4 overflow-hidden rounded-full bg-gray-700">
						{#if fieldSuccessful() > 0}
							<div class="bg-green-500 transition-all" style="width: {(fieldSuccessful() / fieldOutcomeTotal()) * 100}%" title="Successful: {fieldSuccessful()}"></div>
						{/if}
						{#if fieldCancelled() > 0}
							<div class="bg-yellow-500 transition-all" style="width: {(fieldCancelled() / fieldOutcomeTotal()) * 100}%" title="Cancelled: {fieldCancelled()}"></div>
						{/if}
						{#if fieldFailed() > 0}
							<div class="bg-red-500 transition-all" style="width: {(fieldFailed() / fieldOutcomeTotal()) * 100}%" title="Failed: {fieldFailed()}"></div>
						{/if}
						{#if fieldAborted() > 0}
							<div class="bg-orange-500 transition-all" style="width: {(fieldAborted() / fieldOutcomeTotal()) * 100}%" title="Aborted: {fieldAborted()}"></div>
						{/if}
						{#if fieldNoContact() > 0}
							<div class="bg-purple-500 transition-all" style="width: {(fieldNoContact() / fieldOutcomeTotal()) * 100}%" title="No Contact: {fieldNoContact()}"></div>
						{/if}
						{#if fieldRefused() > 0}
							<div class="bg-pink-500 transition-all" style="width: {(fieldRefused() / fieldOutcomeTotal()) * 100}%" title="Refused: {fieldRefused()}"></div>
						{/if}
						{#if fieldServerError() > 0}
							<div class="bg-gray-500 transition-all" style="width: {(fieldServerError() / fieldOutcomeTotal()) * 100}%" title="Server Error: {fieldServerError()}"></div>
						{/if}
					</div>
					<div class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
						<span class="flex items-center gap-1.5">
							<span class="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
							<span class="text-gray-300">Success</span>
							<span class="font-semibold text-white">{fieldSuccessful()}</span>
						</span>
						<span class="flex items-center gap-1.5">
							<span class="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
							<span class="text-gray-300">Cancelled</span>
							<span class="font-semibold text-white">{fieldCancelled()}</span>
						</span>
						<span class="flex items-center gap-1.5">
							<span class="inline-block h-2.5 w-2.5 rounded-full bg-red-500"></span>
							<span class="text-gray-300">Failed</span>
							<span class="font-semibold text-white">{fieldFailed()}</span>
						</span>
						{#if fieldAborted() > 0}
							<span class="flex items-center gap-1.5">
								<span class="inline-block h-2.5 w-2.5 rounded-full bg-orange-500"></span>
								<span class="text-gray-300">Aborted</span>
								<span class="font-semibold text-white">{fieldAborted()}</span>
							</span>
						{/if}
						{#if fieldNoContact() > 0}
							<span class="flex items-center gap-1.5">
								<span class="inline-block h-2.5 w-2.5 rounded-full bg-purple-500"></span>
								<span class="text-gray-300">No Contact</span>
								<span class="font-semibold text-white">{fieldNoContact()}</span>
							</span>
						{/if}
						{#if fieldRefused() > 0}
							<span class="flex items-center gap-1.5">
								<span class="inline-block h-2.5 w-2.5 rounded-full bg-pink-500"></span>
								<span class="text-gray-300">Refused</span>
								<span class="font-semibold text-white">{fieldRefused()}</span>
							</span>
						{/if}
						{#if fieldServerError() > 0}
							<span class="flex items-center gap-1.5">
								<span class="inline-block h-2.5 w-2.5 rounded-full bg-gray-500"></span>
								<span class="text-gray-300">Server Error</span>
								<span class="font-semibold text-white">{fieldServerError()}</span>
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

			<!-- Performance -->
			<div class="mb-8">
				<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Performance</h2>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
						<p class="text-xs font-medium uppercase text-gray-400">Avg Response Time</p>
						<p class="mt-1 text-2xl font-bold text-blue-400">{formatDuration(profile.average_response_time_seconds)}</p>
						<p class="mt-1 text-xs text-gray-500">median {formatDuration(profile.median_response_time_seconds)} · fastest {formatDuration(profile.fastest_response_time_seconds)}</p>
						<p class="mt-0.5 text-[10px] text-gray-600">successful alerts only</p>
					</div>
					<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
						<p class="text-xs font-medium uppercase text-gray-400">Clients Helped</p>
						<p class="mt-1 text-2xl font-bold text-cyan-400">{profile.unique_clients_helped ?? 0}</p>
						<p class="mt-1 text-xs text-gray-500">{profile.repeat_clients ?? 0} repeat clients</p>
					</div>
					<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
						<p class="text-xs font-medium uppercase text-gray-400">Longest Streak</p>
						<p class="mt-1 text-2xl font-bold text-orange-400">{profile.longest_streak_days ?? 0}<span class="ml-1 text-sm font-normal text-gray-400">days</span></p>
						<p class="mt-1 text-xs text-gray-500">current {profile.current_streak_days ?? 0} days</p>
					</div>
					<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
						<p class="text-xs font-medium uppercase text-gray-400">Role Versatility</p>
						<p class="mt-1 text-2xl font-bold text-violet-400">{profile.role_versatility_score ?? 0}<span class="ml-1 text-sm font-normal text-gray-400">/ {Object.keys(MEDRUNNER_ROLES).length} roles</span></p>
						{#if (profile.suspected_trap_count ?? 0) > 0}
							<p class="mt-1 text-xs text-gray-500">{profile.suspected_trap_count} suspected traps</p>
						{/if}
					</div>

					<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
						<p class="text-xs font-medium uppercase text-gray-400">Leaderboard</p>
						<p class="mt-1 text-sm text-gray-400">See how you rank against other medrunners.</p>
						<a href="/leaderboard" class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary-300">
							View Leaderboard →
						</a>
					</div>
				</div>
			</div>

			<!-- Activity Charts -->
			<div class="mb-8">
				<h2 class="mb-3 font-Mohave text-xl font-bold text-white">Activity</h2>
				<div class="grid gap-4 lg:grid-cols-2">
					<!-- Alerts Per Month -->
					{#if profile.alerts_per_month && Object.keys(profile.alerts_per_month).length > 0}
						{@const months = Object.entries(profile.alerts_per_month).sort(([a], [b]) => a.localeCompare(b))}
						{@const maxMonth = Math.max(...months.map(([, c]) => c))}
						<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
							<h3 class="mb-3 text-sm font-semibold uppercase text-gray-400">Alerts Per Month</h3>
							<div class="max-h-64 space-y-1.5 overflow-y-auto pr-1">
								{#each months as [month, count]}
									<div class="flex items-center gap-2 text-sm">
										<span class="w-16 flex-shrink-0 text-right text-gray-400">{month}</span>
										<div class="h-4 flex-1 overflow-hidden rounded bg-gray-700">
											<div class="h-full rounded bg-primary-500 transition-all" style="width: {(count / maxMonth) * 100}%"></div>
										</div>
										<span class="w-8 text-right text-xs text-gray-300">{count}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Activity by Day of Week -->
					{#if profile.activity_by_day_of_week}
						{@const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
						{@const dayCounts = dayLabels.map((_, i) => profile.activity_by_day_of_week[i] || 0)}
						{@const maxDay = Math.max(...dayCounts, 1)}
						<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
							<h3 class="mb-3 text-sm font-semibold uppercase text-gray-400">Activity by Day</h3>
							<div class="flex items-end justify-between gap-2 pt-4" style="height: 140px;">
								{#each dayLabels as label, i}
									{@const count = dayCounts[i]}
									{@const barH = Math.max(Math.round((count / maxDay) * 96), 2)}
									<div class="flex flex-1 flex-col items-center gap-1">
										<div class="w-full rounded-t bg-primary-500 transition-all" style="height: {barH}px"></div>
										<span class="text-[10px] text-gray-400">{label}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Activity by Hour -->
				{#if profile.activity_by_hour_of_day}
					{@const hourCounts = Array.from({ length: 24 }, (_, i) => profile.activity_by_hour_of_day[i] || 0)}
					{@const maxHour = Math.max(...hourCounts, 1)}
					<div class="mt-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
						<h3 class="mb-3 text-sm font-semibold uppercase text-gray-400">Activity by Hour (UTC)</h3>
						<div class="flex items-end gap-px" style="height: 80px;">
							{#each hourCounts as count, i}
								{@const barH = Math.max(Math.round((count / maxHour) * 64), 2)}
								<div class="flex flex-1 flex-col items-center" title="{i}:00 — {count} alerts">
									<div
										class="w-full rounded-t bg-blue-500 transition-all"
										style="height: {barH}px; opacity: {0.35 + (count / maxHour) * 0.65}"
									></div>
								</div>
							{/each}
						</div>
						<div class="mt-1.5 flex justify-between text-[10px] text-gray-500">
							<span>0:00</span>
							<span>6:00</span>
							<span>12:00</span>
							<span>18:00</span>
							<span>23:00</span>
						</div>
					</div>
				{/if}
			</div>

		{/if}
	</div>
</div>

<style>
	/* Tier 1 — Common (gray) */
	.badge-tier-1 {
		border-color: rgb(75 85 99);
		background: rgba(31, 41, 55, 0.5);
	}
	.badge-tier-1:hover {
		border-color: rgb(107 114 128);
	}

	/* Tier 2 — Uncommon (blue glow) */
	.badge-tier-2 {
		border-color: rgb(59 130 246 / 0.5);
		background: rgba(30, 58, 138, 0.2);
		box-shadow: 0 0 8px rgba(59, 130, 246, 0.15);
	}
	.badge-tier-2:hover {
		border-color: rgb(59 130 246 / 0.7);
		box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
	}

	/* Tier 3 — Rare (purple glow) */
	.badge-tier-3 {
		border-color: rgb(168 85 247 / 0.5);
		background: rgba(88, 28, 135, 0.2);
		box-shadow: 0 0 10px rgba(168, 85, 247, 0.2);
		animation: pulse-purple 3s ease-in-out infinite;
	}

	/* Tier 4 — Epic (amber glow, animated) */
	.badge-tier-4 {
		border-color: rgb(245 158 11 / 0.6);
		background: rgba(120, 53, 15, 0.2);
		box-shadow: 0 0 14px rgba(245, 158, 11, 0.25);
		animation: pulse-amber 2.5s ease-in-out infinite;
	}

	/* Tier 5 — Legendary (gold shimmer) */
	.badge-tier-5 {
		border-color: rgb(245 158 11 / 0.7);
		background: linear-gradient(135deg, rgba(120, 53, 15, 0.3), rgba(180, 83, 9, 0.15));
		box-shadow: 0 0 18px rgba(245, 158, 11, 0.3), inset 0 0 12px rgba(245, 158, 11, 0.05);
		animation: shimmer-gold 3s ease-in-out infinite;
	}

	/* Tier 6 — Mythic (red radiant) */
	.badge-tier-6 {
		border-color: rgb(239 68 68 / 0.6);
		background: linear-gradient(135deg, rgba(127, 29, 29, 0.3), rgba(185, 28, 28, 0.15));
		box-shadow: 0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.1);
		animation: radiant-red 2s ease-in-out infinite;
	}

	/* Tier 7 — Transcendent (rose radiant, strong) */
	.badge-tier-7 {
		border-color: rgb(251 113 133 / 0.7);
		background: linear-gradient(135deg, rgba(159, 18, 57, 0.3), rgba(225, 29, 72, 0.15));
		box-shadow: 0 0 24px rgba(251, 113, 133, 0.35), 0 0 48px rgba(251, 113, 133, 0.15);
		animation: radiant-rose 1.8s ease-in-out infinite;
	}

	/* Tier 8 — Immortal (rainbow border with strong glow) */
	.badge-tier-8 {
		background: linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(55, 65, 81, 0.5));
		border: 2px solid transparent;
		background-clip: padding-box;
		position: relative;
		box-shadow: 0 0 28px rgba(255, 255, 255, 0.2), 0 0 56px rgba(168, 85, 247, 0.15);
		animation: immortal-glow 2s ease-in-out infinite;
	}
	.badge-tier-8::before {
		content: '';
		position: absolute;
		inset: -2px;
		border-radius: 0.5rem;
		padding: 2px;
		background: linear-gradient(
			var(--badge-angle, 0deg),
			#f43f5e, #a855f7, #3b82f6, #10b981, #eab308, #f43f5e
		);
		mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		mask-composite: exclude;
		-webkit-mask-composite: xor;
		animation: badge-rotate 3s linear infinite;
		pointer-events: none;
	}

	@keyframes pulse-purple {
		0%, 100% { box-shadow: 0 0 10px rgba(168, 85, 247, 0.2); }
		50% { box-shadow: 0 0 18px rgba(168, 85, 247, 0.4); }
	}

	@keyframes pulse-amber {
		0%, 100% { box-shadow: 0 0 14px rgba(245, 158, 11, 0.25); }
		50% { box-shadow: 0 0 22px rgba(245, 158, 11, 0.5); }
	}

	@keyframes shimmer-gold {
		0%, 100% { box-shadow: 0 0 18px rgba(245, 158, 11, 0.3), inset 0 0 12px rgba(245, 158, 11, 0.05); }
		50% { box-shadow: 0 0 28px rgba(245, 158, 11, 0.5), inset 0 0 20px rgba(245, 158, 11, 0.1); }
	}

	@keyframes radiant-red {
		0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.1); }
		50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.2); }
	}

	@keyframes radiant-rose {
		0%, 100% { box-shadow: 0 0 24px rgba(251, 113, 133, 0.35), 0 0 48px rgba(251, 113, 133, 0.15); }
		50% { box-shadow: 0 0 36px rgba(251, 113, 133, 0.55), 0 0 64px rgba(251, 113, 133, 0.25); }
	}

	@keyframes immortal-glow {
		0%, 100% { box-shadow: 0 0 28px rgba(255, 255, 255, 0.2), 0 0 56px rgba(168, 85, 247, 0.15); }
		50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.35), 0 0 72px rgba(168, 85, 247, 0.3); }
	}

	@property --badge-angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	@keyframes badge-rotate {
		to { --badge-angle: 360deg; }
	}
</style>
