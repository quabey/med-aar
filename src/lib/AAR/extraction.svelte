<script>
	import LocationSearch from '$lib/AAR/LocationSearch.svelte';
	import { extraction, locationDistance } from '$lib/stores.js';
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
</script>

<div class="">
	{#if !$extraction}
		<LocationSearch bind:location={$extraction} />
	{:else}
		<div class="flex flex-row items-center justify-between">
			<div class="">
				{$extraction}
			</div>
			<Button>Edit</Button>
		</div>
	{/if}
</div>
