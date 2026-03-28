<script>
	import LocationSearch from '$lib/AAR/LocationSearch.svelte';

	let { data } = $props();

	const proximityOptions = ['At', 'In', 'On', 'Near', 'Within'];
	const locationTypeOptions = ['Bunker', 'Cave', 'Derelict', 'Space Station', 'City', 'Outpost', 'Surface', 'Orbit', 'Other'];

	const searchTypeMap = {
		'Landing Zone': 'City',
		'Settlement': 'Outpost',
		'Station': 'Space Station',
		'Lagrange Station': 'Space Station',
		'Security / Bunker': 'Bunker',
		'Mining': 'Outpost',
		'Processing': 'Outpost',
		'Research': 'Outpost',
		'Aid Shelter': 'Outpost',
		'Comm Array': 'Outpost',
		'Data Center': 'Outpost',
		'Prison': 'Outpost',
		'Farm': 'Outpost',
		'Salvage': 'Outpost',
		'Wreck': 'Derelict',
		'POI': 'Other',
	};
</script>

<div class="flex flex-col gap-3">
	<!-- Location (POI) -->
	<div>
		{#if !data.location}
			<LocationSearch onselect={(loc) => {
				if (typeof loc === 'object') {
					data.location = loc.name;
					if (loc.planetaryBody) data.planetaryBody = loc.planetaryBody;
					data.isManualLocation = (loc.type === 'Manual entry');
					if (!data.isManualLocation) {
						data.locationType = searchTypeMap[loc.type] ?? 'Other';
					} else {
						data.locationType = '';
					}
				} else {
					data.location = loc;
					data.isManualLocation = true;
					data.locationType = '';
				}
			}} />
		{:else}
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-2">
					<select bind:value={data.locationDistance} class="select w-28">
						<option value="">Proximity</option>
						{#each proximityOptions as opt}
							<option value={opt}>{opt}</option>
						{/each}
					</select>
					<span class="text-gray-200">{data.location}</span>
				</div>
				<button class="btn btn-outline text-sm" onclick={() => (data.location = '')}>
					Change
				</button>
			</div>
		{/if}
	</div>

	<!-- Location Type: shown automatically for search results, manually selectable for custom -->
	{#if data.location && !data.isManualLocation && data.locationType}
		<div class="flex items-center gap-2 text-sm text-gray-400">
			<span class="rounded bg-gray-700/60 px-2 py-0.5 text-xs font-medium text-gray-300">{data.locationType}</span>
		</div>
	{:else if data.location && data.isManualLocation}
		<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
			<label for="location-type" class="text-sm text-gray-300">Location Type</label>
			<select id="location-type" bind:value={data.locationType} class="select w-48">
				<option value="">-- Select --</option>
				{#each locationTypeOptions as opt}
					<option value={opt}>{opt}</option>
				{/each}
			</select>
		</div>
	{/if}

	<!-- Intersystem Response -->
	<div class="border-t border-gray-700/50 pt-3">
		<div class="flex items-center gap-3">
			<label class="flex items-center gap-2 text-sm text-gray-300">
				<input type="checkbox" class="checkbox" bind:checked={data.intersystemResponse.required} />
				Intersystem Response Required
			</label>
		</div>
		{#if data.intersystemResponse.required}
			<div class="mt-2 flex flex-col gap-1">
				<label for="intersystem-details" class="text-sm text-gray-300">Details</label>
				<textarea
					id="intersystem-details"
					bind:value={data.intersystemResponse.details}
					class="textarea min-h-[60px]"
					placeholder="Details about intersystem response..."
				></textarea>
			</div>
		{/if}
	</div>
</div>
