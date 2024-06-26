<script>
	import { ships } from '$lib/stores.js';
	import { Dropdown, DropdownItem, Button, Input } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';

	const medshipOptions = [
		'Cutlass Red',
		'Pisces Rescue',
		'Carrack',
		'Origin 890J',
		'Other',
		'None'
	];
	const gunshipOptions = [
		'Aegis Redeemer',
		'RSI Constellation X',
		'Drake Corsair',
		'Aegis Vanguard Hoplite',
		'Other'
	];

	let qrf = '';

	$: $ships['qrf'] = qrf.split(',');
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-row items-center justify-between">
		<span>Medical Ship:</span>
		<div class="">
			<Button size="sm">
				{$ships.medship || 'Select Medical Ship'}
				<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
			</Button>
			<Dropdown>
				{#each medshipOptions as option}
					<DropdownItem
						on:click={() => {
							$ships.medship = option;
							console.log('Selected Medical Ship:', option);
						}}
					>
						{option}
					</DropdownItem>
				{/each}
			</Dropdown>
		</div>
	</div>

	<div class=" flex flex-row items-center justify-between">
		<span>Gunship:</span>
		<div class="">
			<Button size="sm">
				{$ships.gunship == '' ? 'Select Gunship' : $ships.gunship}
				<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
			</Button>
			<Dropdown>
				{#each gunshipOptions as option}
					<DropdownItem
						on:click={() => {
							$ships.gunship = option;
							console.log('Selected Gunship:', option);
						}}>{option}</DropdownItem
					>
				{/each}
			</Dropdown>
		</div>
	</div>

	<div class=" flex flex-row items-center justify-between">
		<span>QRF (Separate by comma):</span>
		<Input bind:value={qrf} type="text" class="m-2 rounded-xl border-2 border-black p-1 md:w-1/3" />
	</div>

	<div class=" flex flex-row items-center justify-between">
		<span>QRF Ships: {$ships['qrf'].join('; ')}</span>
	</div>
</div>
