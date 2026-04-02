<script>
	import LocationSearch from '$lib/AAR/LocationSearch.svelte';

	let { data } = $props();
</script>

<div>
	{#if !data.extraction}
		<LocationSearch onselect={(loc) => (data.extraction = loc)} />
		<div class="mt-3 flex justify-end">
			<button class="btn-sm btn-outline" onclick={() => (data.extraction = 'refused')}>
				Refused by client
			</button>
		</div>
	{:else if data.extraction === 'refused'}
		<div class="flex items-center justify-between">
			<span class="text-sm text-gray-300">Client refused extraction.</span>
			<button class="btn-sm btn-outline" onclick={() => (data.extraction = '')}>Clear</button>
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<span class="text-gray-200">{data.extraction}</span>
			<button class="btn-sm btn-outline" onclick={() => (data.extraction = '')}>Change</button>
		</div>
	{/if}
</div>
