<script>
	import IncidentReport from '$lib/AAR/IncidentReport.svelte';
	import Extraction from '$lib/AAR/extraction.svelte';
	import Ships from '$lib/AAR/ships.svelte';
	import Timing from '$lib/AAR/timing.svelte';
	import Injury from '$lib/AAR/injury.svelte';
	import Location from '$lib/AAR/Location.svelte';
	import Text from '$lib/AAR/Text.svelte';
	import AlertBreakdown from '$lib/AAR/AlertBreakdown.svelte';
	import VOD from '$lib/AAR/VOD.svelte';
	import AlertType from '$lib/AAR/AlertType.svelte';
	import Encounters from '$lib/AAR/Encounters.svelte';
	import Issues from '$lib/AAR/Issues.svelte';
	import Result from '$lib/AAR/Result.svelte';
	import Summary from '$lib/AAR/Summary.svelte';
	import IntersystemResponse from '$lib/AAR/IntersystemResponse.svelte';
	import { assignmentShips } from '$lib/stores.js';
	import { get } from 'svelte/store';
	import { successToast } from '$lib/state/toast.svelte.js';

	let { sectionItem, data } = $props();

	function importShipsFromAssignments() {
		const ships = get(assignmentShips);
		if (ships.gunship) data.ships.gunship = ships.gunship;
		if (ships.medship) data.ships.medship = ships.medship;
		successToast('Ships imported from assignments');
	}
</script>

<div class="border-l-2 border-primary-500/30 pl-4">
	{#if sectionItem && sectionItem.name}
		<div class="mb-3 flex items-center gap-2">
			<h3 class="font-Mohave text-sm font-bold uppercase tracking-widest text-gray-400">
				{sectionItem.name}
			</h3>
			{#if sectionItem.name === 'ships'}
				<button
					onclick={importShipsFromAssignments}
					class="btn-sm btn-outline text-xs"
				>
					Import from Assignments
				</button>
			{/if}
		</div>
		<div class="section-content">
			{#if sectionItem.name === 'injury'}
				<Injury {data} />
			{:else if sectionItem.name === 'timing'}
				<Timing {data} />
			{:else if sectionItem.name === 'ships'}
				<Ships {data} />
			{:else if sectionItem.name === 'location'}
				<Location {data} />
			{:else if sectionItem.name === 'extraction'}
				<Extraction {data} />
			{:else if sectionItem.name.includes('text')}
				<Text {data} index={Number(sectionItem.name.slice(-1)) - 1} />
			{:else if sectionItem.name === 'alert breakdown'}
				<AlertBreakdown {data} />
			{:else if sectionItem.name === 'incident report'}
				<IncidentReport {data} />
			{:else if sectionItem.name === 'vod'}
				<VOD {data} />
			{:else if sectionItem.name === 'alert type'}
				<AlertType {data} />
			{:else if sectionItem.name === 'encounters'}
				<Encounters {data} />
			{:else if sectionItem.name === 'issues'}
				<Issues {data} />
			{:else if sectionItem.name === 'result'}
				<Result {data} />
			{:else if sectionItem.name === 'summary'}
				<Summary {data} />
			{:else if sectionItem.name === 'intersystem response'}
				<IntersystemResponse {data} />
			{:else}
				<p class="text-sm text-gray-500 italic">Section not implemented yet</p>
			{/if}
		</div>
	{:else}
		<p class="text-sm text-gray-500 italic">Invalid section</p>
	{/if}
</div>
