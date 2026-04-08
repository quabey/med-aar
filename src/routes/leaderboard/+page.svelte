<script>
	let { data } = $props();

	let activeTab = $state('general');
	let activePeriod = $state('alltime');

	// Lazy-loaded period data
	let periodData = $state(/** @type {Record<string, {most_alerts?: any[], most_time?: any[]}>} */({}));
	let periodLoading = $state(false);

	async function selectPeriod(key) {
		activeTab = 'general';
		activePeriod = key;
		if (key === 'alltime' || periodData[key]) return;
		periodLoading = true;
		try {
			const res = await fetch('/api/medrunner/leaderboard');
			const json = await res.json();
			periodData = { ...periodData, monthly: json.monthly ?? {}, weekly: json.weekly ?? {} };
		} catch {}
		periodLoading = false;
	}

	const periods = [
		{ key: 'alltime', label: 'All Time' },
		{ key: 'monthly', label: 'This Month' },
		{ key: 'weekly', label: 'This Week' }
	];

	const generalBoards = [
		{ key: 'most_alerts',          title: 'Most Alerts',               format: 'number',    suffix: 'alerts' },
		{ key: 'most_time',            title: 'Most Time on Alerts',       format: 'totalTime'                  },
		{ key: 'longest_streak',       title: 'Longest Streak (All Time)', format: 'number',    suffix: 'days'   },
		{ key: 'current_streak',       title: 'Longest Streak (Ongoing)',  format: 'number',    suffix: 'days'   },
		{ key: 'longest_alert',        title: 'Longest Single Alert',      format: 'duration'                   },
		{ key: 'most_failed',          title: 'Most Failed Alerts',        format: 'number',    suffix: 'failed' },
		{ key: 'fastest_avg_response', title: 'Fastest Avg Response',      format: 'duration'                   }
	];

	const filteredBoards = [
		{ key: 'most_alerts', title: 'Most Alerts',         format: 'number',    suffix: 'alerts' },
		{ key: 'most_time',   title: 'Most Time on Alerts', format: 'totalTime'                   }
	];

	const currentBoards = $derived(
		activePeriod === 'monthly' ? (periodData.monthly ?? {}) :
		activePeriod === 'weekly'  ? (periodData.weekly  ?? {}) :
		(data.leaderboards ?? {})
	);

	const visibleBoards = $derived(
		activePeriod === 'alltime' ? generalBoards : filteredBoards
	);

	const roleIds = $derived(
		Object.keys(data.leaderboards?.roles ?? {}).sort(
			(a, b) => (data.leaderboards.roles[b]?.entries?.[0]?.value || 0) -
			          (data.leaderboards.roles[a]?.entries?.[0]?.value || 0)
		)
	);

	function formatDuration(seconds) {
		if (!seconds && seconds !== 0) return '-';
		if (seconds < 60) return `${Math.round(seconds * 10) / 10}s`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
		return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
	}

	function formatTotalTime(seconds) {
		if (!seconds) return '-';
		const hours = Math.floor(seconds / 3600);
		if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
		return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
	}

	function formatValue(value, format, suffix) {
		if (value == null) return '-';
		if (format === 'duration') return formatDuration(value);
		if (format === 'totalTime') return formatTotalTime(value);
		if (suffix) return `${value.toLocaleString()} ${suffix}`;
		return value.toLocaleString();
	}

	function getMedalColor(i) {
		if (i === 0) return 'text-yellow-400';
		if (i === 1) return 'text-gray-300';
		if (i === 2) return 'text-amber-600';
		return 'text-gray-500';
	}

	function getMedalBg(i) {
		if (i === 0) return 'bg-yellow-400/10 border-yellow-400/30';
		if (i === 1) return 'bg-gray-300/5 border-gray-400/20';
		if (i === 2) return 'bg-amber-600/10 border-amber-600/20';
		return '';
	}
</script>

<svelte:head>
	<title>Leaderboard - Med-Tools</title>
	<meta property="og:title" content="Medrunner Leaderboard - Med-Tools" />
	<meta property="og:description" content="Medrunner leaderboard — top responders, fastest times, longest streaks, and role rankings." />
	<meta name="twitter:title" content="Medrunner Leaderboard - Med-Tools" />
	<meta name="twitter:description" content="Medrunner leaderboard — top responders, fastest times, longest streaks, and role rankings." />
</svelte:head>

<div class="h-full overflow-y-auto">
	<div class="mx-auto max-w-6xl p-6">

		<!-- Header -->
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="font-Mohave text-3xl font-bold text-white">Leaderboard</h1>
				<p class="mt-1 text-sm text-gray-400">Rankings across {data.totalProfiles} medrunner profiles</p>
				<p class="mt-2 text-xs font-semibold">Disclaimer: This leaderboard only includes medrunners who have profiles. If you don't see yourself, visit your profile and click "Update Stats".</p>
			</div>
		</div>

		<!-- Period + Tab row -->
		<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<!-- Period selector -->
			<div class="flex gap-1 rounded-lg border border-gray-700 bg-gray-800/50 p-1">
				{#each periods as p}
					<button
						class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors {activePeriod === p.key ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}"
						onclick={() => selectPeriod(p.key)}
					>
						{p.label}
					</button>
				{/each}
			</div>

			<!-- General / By Role tabs (all-time only) -->
			{#if activePeriod === 'alltime'}
				<div class="flex gap-1 rounded-lg border border-gray-700 bg-gray-800/50 p-1">
					<button
						class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors {activeTab === 'general' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}"
						onclick={() => (activeTab = 'general')}
					>General</button>
					<button
						class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors {activeTab === 'roles' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}"
						onclick={() => (activeTab = 'roles')}
					>By Role</button>
				</div>
			{/if}
		</div>

		<!-- Period note -->
		{#if activePeriod !== 'alltime'}
			<p class="mb-4 text-xs text-gray-500">
				{activePeriod === 'weekly' ? 'Alert counts from the past 7 days.' : 'Alert counts for the current calendar month.'}
				Other boards are all-time only.
			</p>
		{/if}

		<!-- General boards -->
		{#if activeTab === 'general'}
			<div class="grid gap-6 lg:grid-cols-2">
				{#each visibleBoards as board}
					{@const entries = (currentBoards[board.key] ?? [])}
					{#if entries.length > 0}
						<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-5">
							<h2 class="mb-4 font-Mohave text-lg font-bold text-white">{board.title}</h2>
							<div class="space-y-1.5">
								{#each entries as entry, i}
									<a
										href="/medrunner/{encodeURIComponent(entry.rsi_handle)}"
										class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-700/50 {i < 3 ? 'border ' + getMedalBg(i) : ''}"
									>
										<span class="flex h-7 w-7 flex-shrink-0 items-center justify-center text-sm font-bold {i < 3 ? getMedalColor(i) : 'text-gray-500'}">
											{#if i === 0}🥇{:else if i === 1}🥈{:else if i === 2}🥉{:else}{i + 1}{/if}
										</span>
										<span class="flex-1 truncate text-sm text-gray-200">{entry.rsi_handle}</span>
										<span class="flex-shrink-0 text-sm font-semibold {i < 3 ? getMedalColor(i) : 'text-gray-400'}">
											{formatValue(entry.value, board.format, board.suffix)}
										</span>
									</a>
								{/each}
							</div>
						</div>
					{/if}
				{/each}

				{#if periodLoading}
					<div class="col-span-2 flex flex-col items-center gap-3 py-16">
						<div class="h-7 w-7 animate-spin rounded-full border-2 border-gray-600 border-t-primary-400"></div>
						<p class="text-sm text-gray-500">Loading…</p>
					</div>
				{:else if visibleBoards.every(b => !(currentBoards[b.key]?.length))}
					<div class="col-span-2 py-12 text-center">
						<p class="text-gray-400">No data for this period yet.</p>
					</div>
				{/if}
			</div>

		<!-- By Role (all-time only) -->
		{:else if activeTab === 'roles'}
			<div class="grid gap-6 lg:grid-cols-2">
				{#each roleIds as roleId}
					{@const board = data.leaderboards.roles[roleId]}
					{#if board?.entries?.length > 0}
						<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-5">
							<h2 class="mb-4 font-Mohave text-lg font-bold text-white">
								<span class="mr-2 inline-flex items-center rounded bg-primary-600/20 px-1.5 py-0.5 text-xs font-bold text-primary-400">{board.abbreviation}</span>
								{board.name}
							</h2>
							<div class="space-y-1.5">
								{#each board.entries as entry, i}
									<a
										href="/medrunner/{encodeURIComponent(entry.rsi_handle)}"
										class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-700/50 {i < 3 ? 'border ' + getMedalBg(i) : ''}"
									>
										<span class="flex h-7 w-7 flex-shrink-0 items-center justify-center text-sm font-bold {i < 3 ? getMedalColor(i) : 'text-gray-500'}">
											{#if i === 0}🥇{:else if i === 1}🥈{:else if i === 2}🥉{:else}{i + 1}{/if}
										</span>
										<span class="flex-1 truncate text-sm text-gray-200">{entry.rsi_handle}</span>
										<span class="flex-shrink-0 text-sm font-semibold {i < 3 ? getMedalColor(i) : 'text-gray-400'}">
											{entry.value.toLocaleString()} alerts
										</span>
									</a>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		{#if Object.keys(data.leaderboards ?? {}).length === 0}
			<div class="py-20 text-center">
				<p class="text-lg text-gray-400">No leaderboard data available yet.</p>
				<p class="mt-2 text-sm text-gray-500">Profiles need to be created and updated first.</p>
			</div>
		{/if}

		<p class="mt-8 text-center text-xs text-gray-600">
			Leaderboard includes medrunners with existing profiles. Visit a profile and click "Update Stats" to ensure it's included.
		</p>
	</div>
</div>
