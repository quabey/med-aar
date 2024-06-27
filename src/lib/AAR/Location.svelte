<script>
	import LocationSearch from '$lib/AAR/LocationSearch.svelte';
	import { locationStore, locationDistance } from '$lib/stores.js';
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';

	let location;

	$: $locationStore = location;
</script>

<div class="">
	{#if !location}
		<LocationSearch bind:location />
	{:else}
		<div class="flex flex-row items-center justify-between">
			<div class="">
				<Button>
					{$locationDistance || 'Select Proximity'}
					<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
				</Button>
				<Dropdown>
					{#each ['At', 'In', 'On', 'Near', 'Within'] as preposition}
						<DropdownItem on:click={() => ($locationDistance = preposition)}>
							{preposition}
						</DropdownItem>
					{/each}
				</Dropdown>

				{$locationStore}
			</div>
			<Button>Edit</Button>
		</div>
	{/if}
</div>
