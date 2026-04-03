<script>
	import { config } from '$lib/config/index.svelte.js';

	let { data } = $props();

	const medicalShips = $derived([
		...[...config.ships.medical].sort((a, b) => a.name.localeCompare(b.name)),
		{ name: 'Other', value: 'Other' },
		{ name: 'None', value: 'None' }
	]);

	const combatShips = $derived([
		...[...config.ships.combat].sort((a, b) => a.name.localeCompare(b.name)),
		{ name: 'Other', value: 'Other' },
		{ name: 'None', value: 'None' }
	]);

	const capShipOptions = $derived([
		...[...(config.ships.cap || [])].sort((a, b) => a.name.localeCompare(b.name)),
		{ name: 'Other', value: 'Other' }
	]);

	function addCapShip(value) {
		if (!value) return;
		if (!data.ships.cap) data.ships.cap = [];
		data.ships.cap = [...data.ships.cap, value];
	}

	function removeCapShip(index) {
		data.ships.cap = data.ships.cap.filter((_, i) => i !== index);
	}

	let capSelectValue = $state('');
</script>

<div class="flex flex-col gap-3">
	<!-- Medical Ship -->
	<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
		<label for="medship" class="text-sm text-gray-300">Medical Ship</label>
		<div class="flex flex-wrap items-center gap-2">
			<select id="medship" bind:value={data.ships.medship} class="select w-48">
				<option value="">-- Select --</option>
				{#each medicalShips as ship}
					<option value={ship.value}>{ship.name}</option>
				{/each}
			</select>
			{#if data.ships.medship === 'Other'}
				<input
					type="text"
					bind:value={data.otherShips.medship}
					class="input w-48"
					placeholder="Enter Medical Ship..."
				/>
			{/if}
		</div>
	</div>

	<!-- Gunship -->
	<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
		<label for="gunship" class="text-sm text-gray-300">Gunship</label>
		<div class="flex flex-wrap items-center gap-2">
			<select id="gunship" bind:value={data.ships.gunship} class="select w-48">
				<option value="">-- Select --</option>
				{#each combatShips as ship}
					<option value={ship.value}>{ship.name}</option>
				{/each}
			</select>
			{#if data.ships.gunship === 'Other'}
				<input
					type="text"
					bind:value={data.otherShips.gunship}
					class="input w-48"
					placeholder="Enter Gunship..."
				/>
			{/if}
		</div>
	</div>

	<!-- CAP Ships (multi-select) -->
	<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
		<label class="text-sm text-gray-300">CAP Ships</label>
		<div class="flex flex-wrap items-center gap-2">
			<select class="select w-48" bind:value={capSelectValue} onchange={() => { addCapShip(capSelectValue); capSelectValue = ''; }}>
				<option value="">Add CAP ship...</option>
				{#each capShipOptions as ship}
					<option value={ship.value}>{ship.name}</option>
				{/each}
			</select>
		</div>
	</div>
	{#if data.ships.cap && data.ships.cap.length > 0}
		<div class="flex flex-wrap gap-1.5">
			{#each data.ships.cap as ship, i}
				<span class="inline-flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-xs text-gray-200">
					{ship}
					<button class="text-gray-400 hover:text-red-400" onclick={() => removeCapShip(i)}>✕</button>
				</span>
			{/each}
		</div>
	{/if}

	<!-- Reason -->
	<div class="flex flex-col gap-1">
		<label for="ship-reason" class="text-sm text-gray-300">Reason for Ship Selection</label>
		<input
			id="ship-reason"
			type="text"
			bind:value={data.ships.reason}
			class="input"
			placeholder="Why these ships were chosen..."
		/>
	</div>
</div>
