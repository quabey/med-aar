<script>
	import { ships, otherShips, assignmentShips } from '$lib/stores.js';
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
			{#if $assignmentShips.medship != ''}
				<Button
					outline
					class="font-bold dark:border-primary-400 dark:text-primary-400"
					on:click={() => ($ships.medship = $assignmentShips.medship)}
				>
					Import
				</Button>
			{/if}
			<Button size="sm" class="w-[12rem]">
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
			{#if $ships.medship == 'Other'}
				<Input
					bind:value={$otherShips.medship}
					type="text"
					class="my-2 rounded-xl border-2 border-black p-1"
					placeholder="Enter Medical Ship..."
				/>
			{/if}
		</div>
	</div>

	<div class=" flex flex-row items-center justify-between">
		<span>Gunship:</span>
		<div class="">
			{#if $assignmentShips.gunship != ''}
				<Button
					outline
					class="font-bold dark:border-primary-400 dark:text-primary-400"
					on:click={() => ($ships.gunship = $assignmentShips.gunship)}
				>
					Import
				</Button>
			{/if}
			<Button size="sm" class="w-[12rem]">
				{$ships.gunship == '' ? 'Select Gunship' : $ships.gunship}
				<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
			</Button>
			<Dropdown>
				{#each gunshipOptions as option}
					<DropdownItem
						on:click={() => {
							$ships.gunship = option;
							console.log('Selected Gunship:', option);
						}}
					>
						{option}
					</DropdownItem>
				{/each}
			</Dropdown>
			{#if $ships.gunship == 'Other'}
				<Input
					bind:value={$otherShips.gunship}
					type="text"
					class="my-2 rounded-xl border-2 border-black p-1"
				/>
			{/if}
		</div>
	</div>

	<div class=" flex flex-row items-center justify-between">
		<span>QRF / Additional Ships (Separate by comma):</span>
		<Input bind:value={qrf} type="text" class="m-2 rounded-xl border-2 border-black p-1 md:w-1/3" />
	</div>

	{#if $ships['qrf'].length > 0 && $ships['qrf'][0] != ''}
		<div class=" flex flex-row items-center justify-between">
			{$ships['qrf'].length}
			<span>QRF / Additional Ships: {$ships['qrf'].join(', ')}</span>
		</div>
	{/if}
</div>
