<script>
	import { sections } from '$lib/stores.js';
	import Ships from '$lib/AAR/ships.svelte';
	import Timing from '$lib/AAR/timing.svelte';
	import Injury from '$lib/AAR/injury.svelte';
	import { Card } from 'flowbite-svelte';
	import { CloseOutline } from 'flowbite-svelte-icons';

	export let sectionIndex;

	function removeCard() {
		$sections = $sections.filter((section) => section != sectionIndex);
	}
</script>

<Card class="relative m-2 w-[50rem] max-w-7xl">
	<div class="absolute right-2 top-2">
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
	{:else}
		<span>Section not implemented yet</span>
	{/if}
</Card>
