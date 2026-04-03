<script>
	import { untrack } from 'svelte';
	import { supabase } from '$lib/supabaseClient.js';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	function renderMarkdown(text) {
		if (!text) return '';
		return DOMPurify.sanitize(marked.parse(text));
	}

	let filters = $state({
		client: '',
		mission: '',
		system: '',
		threat_level: '',
		status: '',
		team_member: '',
		from_date: '',
		to_date: ''
	});

	let results = $state([]);
	let totalCount = $state(0);
	let loading = $state(false);
	let page = $state(0);
	let hasSearched = $state(false);
	const pageSize = 50;

	const statusLabels = {
		0: 'Open',
		1: 'Active',
		2: 'Concluded',
		3: 'Success',
		6: 'Cancelled',
		8: 'Aborted',
		9: 'Game Error'
	};

	const threatLabels = {
		0: 'Unknown',
		1: 'None',
		2: 'PvE',
		3: 'PvP'
	};

	const statusColors = {
		0: 'bg-blue-600/20 text-blue-400',
		1: 'bg-yellow-600/20 text-yellow-400',
		2: 'bg-green-600/20 text-green-400',
		3: 'bg-green-600/20 text-green-400',
		6: 'bg-red-600/20 text-red-400',
		8: 'bg-orange-600/20 text-orange-400',
		9: 'bg-purple-600/20 text-purple-400'
	};

	const threatColors = {
		0: 'bg-gray-600/20 text-gray-400',
		1: 'bg-green-600/20 text-green-400',
		2: 'bg-yellow-600/20 text-yellow-400',
		3: 'bg-red-600/20 text-red-400'
	};

	function formatTimestamp(ts) {
		if (!ts) return '-';
		let date;
		if (ts > 1e16) {
			date = new Date((ts - 621355968000000000) / 10000);
		} else if (ts > 1e12) {
			date = new Date(ts);
		} else {
			date = new Date(ts * 1000);
		}
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function search() {
		loading = true;
		hasSearched = true;

		const params = {
			p_client: filters.client || null,
			p_mission: filters.mission || null,
			p_system: filters.system || null,
			p_threat_level: filters.threat_level !== '' ? parseInt(filters.threat_level) : null,
			p_status: filters.status !== '' ? parseInt(filters.status) : null,
			p_team_member: filters.team_member || null,
			p_from_ts: filters.from_date ? new Date(filters.from_date).getTime() : null,
			p_to_ts: filters.to_date ? new Date(filters.to_date + 'T23:59:59').getTime() : null,
			p_limit: pageSize,
			p_offset: page * pageSize
		};

		const countParams = { ...params };
		delete countParams.p_limit;
		delete countParams.p_offset;

		const [searchRes, countRes] = await Promise.all([
			supabase.rpc('search_completed_alerts', params),
			supabase.rpc('count_completed_alerts', countParams)
		]);

		if (searchRes.error) {
			console.error('Search error:', searchRes.error);
			results = [];
			totalCount = 0;
			loading = false;
			return;
		}

		results = searchRes.data || [];
		totalCount = countRes.data || 0;
		loading = false;
	}

	function doSearch() {
		page = 0;
		search();
	}

	function nextPage() {
		page++;
		search();
	}

	function prevPage() {
		if (page > 0) {
			page--;
			search();
		}
	}

	function clearFilters() {
		filters = {
			client: '',
			mission: '',
			system: '',
			threat_level: '',
			status: '',
			team_member: '',
			from_date: '',
			to_date: ''
		};
		page = 0;
		results = [];
		totalCount = 0;
		hasSearched = false;
	}

	const totalPages = $derived(Math.ceil(totalCount / pageSize));

	// Initial load — untrack so filter changes don't auto-trigger
	$effect(() => {
		untrack(() => search());
	});

	// Expanded alert detail
	let expandedId = $state(null);

	function getTeamMembers(alert) {
		const team = alert.responding_team;
		if (!team) return [];
		return [
			...(team.staff || []),
			...(team.allMembers || []),
			...(team.dispatchers || [])
		].filter((m, i, arr) => arr.findIndex(x => x.discordId === m.discordId) === i);
	}
</script>

<svelte:head>
	<title>Alerts - Med-Tools</title>
</svelte:head>

<div class="h-full overflow-y-auto">
	<div class="mx-auto max-w-7xl p-6">
		<div class="mb-6">
			<h1 class="font-Mohave text-3xl font-bold text-white">Completed Alerts</h1>
			<p class="mt-1 text-sm text-gray-400">
				{#if hasSearched}
					{totalCount.toLocaleString()} alert{totalCount !== 1 ? 's' : ''} found
				{/if}
			</p>
		</div>

		<!-- Filters -->
		<div class="mb-6 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
			<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
				<div>
					<label class="mb-1 block text-xs text-gray-400">Client RSI Handle</label>
					<input
						type="text"
						bind:value={filters.client}
						class="input w-full text-sm"
						placeholder="Search client..."
						onkeydown={(e) => e.key === 'Enter' && doSearch()}
					/>
				</div>
				<div>
					<label class="mb-1 block text-xs text-gray-400">Mission Name</label>
					<input
						type="text"
						bind:value={filters.mission}
						class="input w-full text-sm"
						placeholder="Search mission..."
						onkeydown={(e) => e.key === 'Enter' && doSearch()}
					/>
				</div>
				<div>
					<label class="mb-1 block text-xs text-gray-400">System</label>
					<input
						type="text"
						bind:value={filters.system}
						class="input w-full text-sm"
						placeholder="Search system..."
						onkeydown={(e) => e.key === 'Enter' && doSearch()}
					/>
				</div>
				<div>
					<label class="mb-1 block text-xs text-gray-400">Team Member</label>
					<input
						type="text"
						bind:value={filters.team_member}
						class="input w-full text-sm"
						placeholder="Name or Discord ID..."
						onkeydown={(e) => e.key === 'Enter' && doSearch()}
					/>
				</div>
				<div>
					<label class="mb-1 block text-xs text-gray-400">Threat Level</label>
					<select bind:value={filters.threat_level} class="select w-full text-sm">
						<option value="">All</option>
						{#each Object.entries(threatLabels) as [val, label]}
							<option value={val}>{label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="mb-1 block text-xs text-gray-400">Status</label>
					<select bind:value={filters.status} class="select w-full text-sm">
						<option value="">All</option>
						{#each Object.entries(statusLabels) as [val, label]}
							<option value={val}>{label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="mb-1 block text-xs text-gray-400">From Date</label>
					<input type="date" bind:value={filters.from_date} class="input w-full text-sm" />
				</div>
				<div>
					<label class="mb-1 block text-xs text-gray-400">To Date</label>
					<input type="date" bind:value={filters.to_date} class="input w-full text-sm" />
				</div>
			</div>
			<div class="mt-3 flex gap-2">
				<button class="btn btn-primary text-sm" onclick={doSearch}>Search</button>
				<button class="btn btn-secondary text-sm" onclick={clearFilters}>Clear</button>
			</div>
		</div>

		<!-- Results -->
		{#if loading}
			<LoadingSpinner message="Searching alerts..." />
		{:else if results.length === 0 && hasSearched}
			<div class="py-12 text-center">
				<p class="text-gray-500">No alerts found matching your criteria.</p>
			</div>
		{:else if results.length > 0}
			<div class="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800/50">
				<table class="w-full text-left text-sm">
					<thead>
						<tr class="border-b border-gray-700 text-xs uppercase text-gray-400">
							<th class="px-4 py-3">Date</th>
							<th class="px-4 py-3">Client</th>
							<th class="px-4 py-3">Mission</th>
							<th class="px-4 py-3">System</th>
							<th class="px-4 py-3">Threat</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Rating</th>
						</tr>
					</thead>
					<tbody>
						{#each results as alert}
							<tr
								class="cursor-pointer border-b border-gray-700/50 transition-colors hover:bg-gray-700/30 last:border-b-0"
								onclick={() => (expandedId = expandedId === alert.id ? null : alert.id)}
							>
								<td class="whitespace-nowrap px-4 py-3 text-gray-300">
									{formatTimestamp(alert.creation_timestamp)}
								</td>
								<td class="px-4 py-3 text-gray-200">{alert.client_rsi_handle || '-'}</td>
								<td class="px-4 py-3 text-gray-300">{alert.mission_name || '-'}</td>
								<td class="px-4 py-3 text-gray-300">
									{alert.system || '-'}
									{#if alert.subsystem}
										<span class="text-gray-500"> / {alert.subsystem}</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									{#if alert.threat_level != null}
										<span
											class="rounded px-2 py-0.5 text-xs {threatColors[alert.threat_level] || 'bg-gray-600/20 text-gray-400'}"
										>
											{threatLabels[alert.threat_level] || alert.threat_level}
										</span>
									{:else}
										-
									{/if}
								</td>
								<td class="px-4 py-3">
									{#if alert.status != null}
										<span
											class="rounded px-2 py-0.5 text-xs {statusColors[alert.status] || 'bg-gray-600/20 text-gray-400'}"
										>
											{statusLabels[alert.status] || alert.status}
										</span>
									{:else}
										-
									{/if}
								</td>
								<td class="px-4 py-3 text-gray-300">
									{#if alert.rating != null}
										{'⭐'.repeat(Math.min(alert.rating, 5))}
									{:else}
										-
									{/if}
								</td>
							</tr>
							{#if expandedId === alert.id}
								<tr>
									<td colspan="7" class="bg-gray-800/80 px-6 py-4">
										<div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
											<div>
												<span class="text-xs text-gray-500">Location</span>
												<p class="text-gray-300">
													{alert.system || '?'}
													{#if alert.subsystem} / {alert.subsystem}{/if}
													{#if alert.tertiary_location} / {alert.tertiary_location}{/if}
												</p>
											</div>
											<div>
												<span class="text-xs text-gray-500">Accepted</span>
												<p class="text-gray-300">{formatTimestamp(alert.accepted_timestamp)}</p>
											</div>
											<div>
												<span class="text-xs text-gray-500">Completed</span>
												<p class="text-gray-300">{formatTimestamp(alert.completion_timestamp)}</p>
											</div>
											<div>
												<span class="text-xs text-gray-500">Subscription</span>
												<p class="text-gray-300">{alert.subscription_tier || '-'}</p>
											</div>
											<div>
												<span class="text-xs text-gray-500">Complete</span>
												<p class="text-gray-300">{alert.is_complete ? 'Yes' : 'No'}</p>
											</div>
											<div>
												<span class="text-xs text-gray-500">Test</span>
												<p class="text-gray-300">{alert.test ? 'Yes' : 'No'}</p>
											</div>
											{#if alert.rating_remarks}
												<div class="col-span-full">
													<span class="text-xs text-gray-500">Rating Remarks</span>
													<p class="text-gray-300">{alert.rating_remarks}</p>
												</div>
											{/if}
											{#if alert.aar_remarks}
												<div class="col-span-full">
													<span class="text-xs text-gray-500">AAR Remarks</span>
													<div class="prose prose-sm prose-invert max-w-none text-gray-300">
														{@html renderMarkdown(alert.aar_remarks)}
													</div>
												</div>
											{/if}
											{#if alert.cancellation_reason}
												<div>
													<span class="text-xs text-gray-500">Cancellation Reason</span>
													<p class="text-gray-300">{alert.cancellation_reason}</p>
												</div>
											{/if}
											<div>
												<span class="text-xs text-gray-500">Alert ID</span>
												<p class="font-mono text-xs text-gray-400">{alert.id}</p>
											</div>
										</div>
										{#each [getTeamMembers(alert)] as allMembers}
											{#if allMembers.length > 0}
												<div class="mt-3 border-t border-gray-700 pt-3">
													<span class="text-xs text-gray-500">Team Members ({allMembers.length})</span>
													<div class="mt-1 flex flex-wrap gap-2">
														{#each allMembers as member}
															<a
																	href="/medrunner/{encodeURIComponent(member.rsiHandle || member.discordId)}"
																class="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-600 hover:text-white"
																onclick={(e) => e.stopPropagation()}
															>
																{member.rsiHandle || member.discordUsername || member.discordId}
																{#if (alert.responding_team?.staff || []).some(s => s.discordId === member.discordId)}
																	<span class="ml-1 text-[10px] text-yellow-400">staff</span>
																{/if}
																{#if (alert.responding_team?.dispatchers || []).some(d => d.discordId === member.discordId)}
																	<span class="ml-1 text-[10px] text-blue-400">dispatch</span>
																{/if}
															</a>
														{/each}
													</div>
												</div>
											{/if}
										{/each}
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-4 flex items-center justify-between">
					<p class="text-sm text-gray-400">
						Page {page + 1} of {totalPages}
					</p>
					<div class="flex gap-2">
						<button
							class="btn btn-secondary text-sm"
							onclick={prevPage}
							disabled={page === 0}
						>
							Previous
						</button>
						<button
							class="btn btn-secondary text-sm"
							onclick={nextPage}
							disabled={page >= totalPages - 1}
						>
							Next
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
