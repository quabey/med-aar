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

	let { sectionItem, data, onremove } = $props();

	function importShipsFromAssignments() {
		const ships = get(assignmentShips);
		if (ships.gunship) data.ships.gunship = ships.gunship;
		if (ships.medship) data.ships.medship = ships.medship;
		successToast('Ships imported from assignments');
	}
</script>

<div class="rounded-xl border border-gray-700/50 bg-gray-800 p-4 shadow-md transition-colors hover:border-gray-600/50 sm:p-5">
	{#if sectionItem && sectionItem.name}
		<div class="mb-3 flex items-center justify-between">
			<h3 class="font-Mohave text-lg font-semibold uppercase tracking-wide text-gray-200">
				{sectionItem.name}
			</h3>
			<div class="flex items-center gap-1.5">
				{#if sectionItem.name === 'ships'}
					<button
						onclick={importShipsFromAssignments}
						class="btn-sm btn-outline text-xs"
					>
						Import from Assignments
					</button>
				{/if}
				<button
					onclick={onremove}
					class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-700 hover:text-red-400"
					title="Remove section"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
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
