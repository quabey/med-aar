<script>
	import Ships from '$lib/AAR/ships.svelte';
	import Timing from '$lib/AAR/timing.svelte';
	import Injury from '$lib/AAR/injury.svelte';
	import { Card } from 'flowbite-svelte';

	export let sectionIndex;
</script>

<Card class="m-2 w-[50rem] max-w-7xl">
	{#if sectionIndex.name == 'injury'}
		<Injury />
	{:else if sectionIndex.name == 'timing'}
		<Timing />
	{:else if sectionIndex.name == 'ships'}
		<Ships />
	{/if}
</Card>
