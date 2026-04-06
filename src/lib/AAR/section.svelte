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

	const COLLAPSED_KEY = 'medtools:collapsedSections';

	let { sectionItem, data } = $props();

	function loadCollapsed() {
		if (typeof window === 'undefined') return new Set();
		try {
			const raw = localStorage.getItem(COLLAPSED_KEY);
			return raw ? new Set(JSON.parse(raw)) : new Set();
		} catch {
			return new Set();
		}
	}

	function saveCollapsed(set) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...set]));
	}

	// Track user-toggled sections; null means use localStorage default
	let userToggled = $state(null);
	const collapsed = $derived(userToggled !== null ? userToggled : (typeof window !== 'undefined' ? loadCollapsed().has(sectionItem?.name) : false));

	function toggleCollapse() {
		const newVal = !collapsed;
		userToggled = newVal;
		const set = loadCollapsed();
		if (newVal) {
			set.add(sectionItem.name);
		} else {
			set.delete(sectionItem.name);
		}
		saveCollapsed(set);
	}

	function importShipsFromAssignments() {
		const ships = get(assignmentShips);
		if (ships.gunship) data.ships.gunship = ships.gunship;
		if (ships.medship) data.ships.medship = ships.medship;
		successToast('Ships imported from assignments');
	}
</script>

<div class="border-l-2 border-primary-500/30 pl-4">
	{#if sectionItem && sectionItem.name}
		<button
			class="mb-3 flex w-full items-center gap-2 text-left"
			onclick={toggleCollapse}
		>
			<svg
				class="h-4 w-4 flex-shrink-0 text-gray-500 transition-transform {collapsed ? '' : 'rotate-90'}"
				fill="none" stroke="currentColor" viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
			<h3 class="font-Mohave text-sm font-bold uppercase tracking-widest text-gray-400">
				{sectionItem.name}
			</h3>
			{#if sectionItem.name === 'ships'}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<span
					class="btn-sm btn-outline text-xs"
					role="button"
					tabindex="0"
					onclick={(e) => { e.stopPropagation(); importShipsFromAssignments(); }}
				>
					Import from Assignments
				</span>
			{/if}
		</button>
		{#if !collapsed}
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
		{/if}
	{:else}
		<p class="text-sm text-gray-500 italic">Invalid section</p>
	{/if}
</div>
