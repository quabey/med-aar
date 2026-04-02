<script>
	import { config } from '$lib/config/index.svelte.js';

	let { data } = $props();

	const alertTypes = $derived([
		...config.alertTypes,
	]);
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
		<label for="alertType" class="text-sm text-gray-300">Alert Type</label>
		<div class="flex flex-wrap items-center gap-2">
			<select
				id="alertType"
				bind:value={data.alertType}
				class="select w-48"
			>
				<option value="">-- Select --</option>
				{#each alertTypes as type}
					<option value={type.value}>{type.name}</option>
				{/each}
			</select>
			{#if data.alertType === 'Other'}
				<input
					type="text"
					bind:value={data.alertTypeOther}
					class="input w-48"
					placeholder="Enter Alert Type..."
				/>
			{/if}
		</div>
	</div>
</div>
