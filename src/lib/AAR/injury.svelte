<script>
	let { data } = $props();

	const injuryOptions = ['None', 'Tier 1', 'Tier 2', 'Tier 3', 'Unknown'];
	const bodyParts = ['head', 'chest', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];

	function formatPartName(part) {
		return part
			.replace(/([A-Z])/g, ' $1')
			.trim()
			.split(' ')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	function setAll(value) {
		for (const part of bodyParts) {
			data.injuries[part] = value;
		}
	}
</script>

<div class="flex flex-col gap-3">
	{#each bodyParts as part}
		<div class="flex items-center justify-between gap-2">
			<label for="injury-{part}" class="text-sm text-gray-300">{formatPartName(part)}</label>
			<select id="injury-{part}" bind:value={data.injuries[part]} class="select w-36">
				{#each injuryOptions as option}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>
	{/each}

	<div class="flex justify-center gap-2 pt-2">
		<button class="btn btn-secondary text-sm" onclick={() => setAll('None')}>Set All None</button>
		<button class="btn btn-secondary text-sm" onclick={() => setAll('Unknown')}>
			Set All Unknown
		</button>
	</div>
</div>
