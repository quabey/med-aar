<script>
	let { data } = $props();

	const extractedToOptions = ['Station', 'Lobby', 'On-Site Hangar/Pads', 'Surface', 'Player Ship', 'Declined', 'N/A'];
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
		<label for="result-extracted" class="text-sm text-gray-300">Client Extracted To</label>
		<select id="result-extracted" bind:value={data.result.extractedTo} class="select w-48">
			<option value="">-- Select --</option>
			{#each extractedToOptions as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-1">
		<label for="result-challenges" class="text-sm text-gray-300">Challenges</label>
		<textarea
			id="result-challenges"
			bind:value={data.result.challenges}
			class="textarea min-h-[60px]"
			placeholder="Any challenges faced..."
		></textarea>
	</div>

	<div class="flex flex-col gap-1">
		<label for="result-failure" class="text-sm text-gray-300">Failure / Abort Reason</label>
		<textarea
			id="result-failure"
			bind:value={data.result.failureReason}
			class="textarea min-h-[60px]"
			placeholder="If applicable, reason for failure or abort..."
		></textarea>
	</div>
</div>
