<script>
	import IncidentReport from '$lib/AAR/IncidentReport.svelte';
	import Extraction from '$lib/AAR/extraction.svelte';
	import { sections } from '$lib/stores.js';
	import Ships from '$lib/AAR/ships.svelte';
	import Timing from '$lib/AAR/timing.svelte';
	import Injury from '$lib/AAR/injury.svelte';
	import Location from '$lib/AAR/Location.svelte';
	import Text from '$lib/AAR/Text.svelte';
	import AlertBreakdown from '$lib/AAR/AlertBreakdown.svelte';
	import VOD from '$lib/AAR/VOD.svelte';
	import AlertType from './AlertType.svelte';
	import { Card } from 'flowbite-svelte';
	import { CloseOutline } from 'flowbite-svelte-icons';

	export let sectionIndex;

	function removeCard() {
		$sections = $sections.filter((section) => section != sectionIndex);
	}
</script>

<Card class="m-2 w-full max-w-7xl sm:p-4 md:w-[50rem]">
	{#if sectionIndex && sectionIndex.name}
		<div class="mb-2 flex flex-row items-center justify-between">
			<span class="font-Mohave text-2xl font-semibold uppercase dark:text-white">
				{sectionIndex.name}
			</span>
			<button on:click={removeCard}>
				<CloseOutline class="h-6 w-6 text-white dark:text-white" />
			</button>
		</div>
		{#if sectionIndex.name == 'injury'}
			<Injury />
		{:else if sectionIndex.name == 'timing'}
			<Timing />
		{:else if sectionIndex.name == 'ships'}
			<Ships />
		{:else if sectionIndex.name == 'location'}
			<Location />
		{:else if sectionIndex.name == 'accident report'}
			<span>Section not implemented yet</span>
		{:else if sectionIndex.name == 'team remarks'}
			<span>Section not implemented yet</span>
		{:else if sectionIndex.name == 'extraction'}
			<Extraction />
		{:else if sectionIndex.name.includes('text')}
			<Text index={sectionIndex.name.slice(-1) - 1} />
		{:else if sectionIndex.name == 'alert breakdown'}
			<AlertBreakdown />
		{:else if sectionIndex.name == 'incident report'}
			<IncidentReport />
		{:else if sectionIndex.name == 'vod'}
			<VOD />
		{:else if sectionIndex.name == 'alert type'}
			<AlertType />
		{:else}
			<span>Section not implemented yet</span>
		{/if}
	{:else}
		<span>Invalid section</span>
	{/if}
</Card>
