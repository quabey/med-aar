<script>
	let { data } = $props();

	const pveOptions = ['None', 'Minor', 'Moderate', 'Heavy'];
	const pvpOptions = ['None', 'Minor', 'Moderate', 'Heavy'];
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
		<label for="enc-pve" class="text-sm text-gray-300">PVE Encounters</label>
		<select id="enc-pve" bind:value={data.encounters.pve} class="select w-48">
			<option value="">-- Select --</option>
			{#each pveOptions as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
		<label for="enc-pvp" class="text-sm text-gray-300">PVP Encounters</label>
		<select id="enc-pvp" bind:value={data.encounters.pvp} class="select w-48">
			<option value="">-- Select --</option>
			{#each pvpOptions as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-1">
		<label for="enc-actions" class="text-sm text-gray-300">Actions Taken</label>
		<textarea
			id="enc-actions"
			bind:value={data.encounters.actionsTaken}
			class="textarea min-h-[80px]"
			placeholder="Describe actions taken during encounters..."
		></textarea>
	</div>
</div>
