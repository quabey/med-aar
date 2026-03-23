<script>
	import { config } from '$lib/config/index.svelte.js';
	import Fuse from 'fuse.js';

	let { onselect } = $props();

	let searchInput = $state('');
	let results = $state([]);

	const fuse = $derived(
		new Fuse(config.locations, {
			threshold: 0.35,
			includeScore: true,
			keys: ['name', 'type']
		})
	);

	function search() {
		const sanitized = searchInput.trim().replace(/[^a-zA-Z0-9 ]/g, '');
		searchInput = sanitized;
		if (!sanitized) {
			results = [];
			return;
		}
		let found = fuse.search(sanitized).slice(0, 10);
		// Always add manual entry option
		const manualEntry = { item: { name: sanitized, type: 'Manual' } };
		if (found.length === 0) {
			results = [manualEntry];
		} else {
			results = [...found, manualEntry];
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Enter') search();
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex gap-2">
		<input
			type="search"
			bind:value={searchInput}
			oninput={search}
			onkeydown={handleKeydown}
			class="input flex-1"
			placeholder="Search locations..."
		/>
	</div>

	{#if results.length > 0}
		<div class="max-h-64 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800/50">
			<table class="w-full text-sm">
				<thead class="sticky top-0 bg-gray-800">
					<tr class="border-b border-gray-700 text-left text-xs text-gray-400">
						<th class="px-3 py-2">Name</th>
						<th class="px-3 py-2">Type</th>
						<th class="px-3 py-2 text-right">Action</th>
					</tr>
				</thead>
				<tbody>
					{#each results as result}
						<tr class="border-b border-gray-700/50 transition-colors hover:bg-gray-700/50">
							<td class="px-3 py-2 text-gray-200">{result.item?.name ?? ''}</td>
							<td class="px-3 py-2 text-gray-400">{result.item?.type ?? ''}</td>
							<td class="px-3 py-2 text-right">
								<button
									class="btn-sm btn-primary"
									onclick={() => onselect(result.item)}
								>
									Select
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
