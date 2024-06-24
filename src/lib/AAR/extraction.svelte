<script>
	import { extraction } from '$lib/stores.js';
	import { Dropdown, DropdownItem, Button } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';

	const locationOption = [
		'Baijini Point',
		'Covalex Shipping Hub Gundo',
		'Everus Harbor',
		'Grim Hex',
		'INS Jericho',
		'Port Tressler',
		'Seraphim Station',
		'Magnus Gateway',
		'Pyro Gateway',
		'Terra Gateway',
		'ARC L1 Wide Forest',
		'ARCL2 Lively Pathway',
		'ARCL3 Modern Express',
		'ARCL4 Faint Glen',
		'ARCL5 Yellow Core',
		'CRU L1 Ambitious Dream',
		'CRU L4 Shallow Fields',
		'CRU L5 Beautiful Glen',
		'HUR L1 Green Glade',
		'HUR L2 Faithful Dream',
		'HUR L3 Thundering Express',
		'HUR L4 Melodic Fields',
		'HUR L5 High Course',
		'MIC L1 Shallow Frontier',
		'MICL2 Long Forest',
		'MICL3 Endless Odyssey',
		'MICL4 Red Crossroads',
		'MICL5 Modern Icarus'
	];
</script>

<div class="flex flex-row items-center justify-between">
	<span>Location</span>
	<div class="">
		<Button>
			{$extraction == 'none' ? 'Select Location' : $extraction}
			<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
		</Button>
		<Dropdown>
			{#each locationOption as option}
				<DropdownItem
					on:click={() => {
						$extraction = option;
					}}
				>
					{option}
				</DropdownItem>
			{/each}
		</Dropdown>
	</div>
</div>
