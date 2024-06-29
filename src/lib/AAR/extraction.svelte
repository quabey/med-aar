<script>
	import LocationSearch from '$lib/AAR/LocationSearch.svelte';
	import { extraction } from '$lib/stores.js';
	import { Button } from 'flowbite-svelte';
</script>

<div class="">
	{#if !$extraction}
		<LocationSearch bind:location={$extraction} />
	{:else if $extraction == 'refused'}
		<div class="flex flex-row items-center justify-between">
			<div class="">
				<span>Client refused Extration.</span>
			</div>
			<Button on:click={() => ($extraction = '')}>Clear</Button>
		</div>
	{:else}
		<div class="flex flex-row items-center justify-between">
			<div class="">
				{$extraction}
			</div>
			<Button>Edit</Button>
		</div>
	{/if}
	<div class="mt-2 flex justify-end">
		{#if $extraction != 'refused'}
			<Button
				outline
				class="font-bold dark:border-primary-400 dark:text-primary-400"
				on:click={() => ($extraction = 'refused')}>Refused by client</Button
			>
		{/if}
	</div>
</div>
