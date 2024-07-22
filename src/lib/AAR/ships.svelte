<script>
	import { ships, otherShips, assignmentShips } from '$lib/stores.js';
	import { Select, Label, Button, Input } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import shipsData from '$lib/data/ships.json';

	let qrf = '';

	$: $ships['qrf'] = qrf.split(',');

	const medicalShips = [
		...shipsData.medical,
		{ name: 'Other', value: 'Other' },
		{ name: 'None', value: 'None' }
	];
	const combatShips = [
		...shipsData.combat,
		{ name: 'Other', value: 'Other' },
		{ name: 'None', value: 'None' }
	];
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-row items-center justify-between">
		<span>Medical Ship:</span>
		<div class="flex flex-row items-center justify-center gap-2">
			{#if $assignmentShips.medship != ''}
				<div class="">
					<Button
						size="sm"
						outline
						class="font-bold dark:border-primary-400 dark:text-primary-400"
						on:click={() => ($ships.medship = $assignmentShips.medship)}
					>
						Import
					</Button>
				</div>
			{/if}
			<Select class="w-[12rem]" items={medicalShips} bind:value={$ships.medship} />
			{#if $ships.medship == 'Other'}
				<Input
					bind:value={$otherShips.medship}
					type="text"
					class="my-2 rounded-xl border-2 border-black"
					placeholder="Enter Medical Ship..."
				/>
			{/if}
		</div>
	</div>

	<div class="flex flex-row items-center justify-between">
		<span>Gunship:</span>
		<div class="flex flex-row items-center justify-center gap-2">
			{#if $assignmentShips.gunship != ''}
				<div class="">
					<Button
						size="sm"
						outline
						class="font-bold dark:border-primary-400 dark:text-primary-400"
						on:click={() => ($ships.gunship = $assignmentShips.gunship)}
					>
						Import
					</Button>
				</div>
			{/if}
			<Select class="w-[12rem]" items={combatShips} bind:value={$ships.gunship} />
			{#if $ships.gunship == 'Other'}
				<Input
					bind:value={$otherShips.gunship}
					type="text"
					class="my-2 rounded-xl border-2 border-black"
					placeholder="Enter Gunship..."
				/>
			{/if}
		</div>
	</div>

	<div class="flex flex-row items-center justify-between">
		<span>QRF / Additional Ships (Separate by comma):</span>
		<Input bind:value={qrf} type="text" class="m-2 rounded-xl border-2 border-black p-1 md:w-1/3" />
	</div>

	{#if $ships['qrf'].length > 0 && $ships['qrf'][0] != ''}
		<div class="flex flex-row items-center justify-between">
			{$ships['qrf'].length}
			<span>QRF / Additional Ships: {$ships['qrf'].join(', ')}</span>
		</div>
	{/if}
</div>
