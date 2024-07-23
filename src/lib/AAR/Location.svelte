<script>
	import LocationSearch from '$lib/AAR/LocationSearch.svelte';
	import { location, locationDistance } from '$lib/stores.js';
	import { Button, Select, Label } from 'flowbite-svelte';
	import { PenOutline } from 'flowbite-svelte-icons';
</script>

<div class="">
	{#if !$location}
		<LocationSearch bind:location={$location} />
	{:else}
		<div class="flex flex-row items-center justify-between">
			<div class="flex flex-row items-center justify-center gap-2">
				<Select
					class="w-64"
					items={['At', 'In', 'On', 'Near', 'Within'].map((preposition) => ({
						value: preposition,
						name: preposition
					}))}
					bind:value={$locationDistance}
					placeholder="Select Proximity..."
				/>
				<span class="w-full">{$location}</span>
			</div>
			<Button on:click={() => ($location = '')}>Edit <PenOutline class="ml-2" /></Button>
		</div>
	{/if}
</div>
