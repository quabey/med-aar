<script>
	import LocationSearch from '$lib/AAR/LocationSearch.svelte';
	import { extraction, locationDistance } from '$lib/stores.js';
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
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
	<div class="mt-2">
		{#if $extraction != 'refused'}
			<Button on:click={() => ($extraction = 'refused')}>Refused by client</Button>
		{/if}
	</div>
</div>
