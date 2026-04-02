<script>
	let { data } = $props();

	const issueTypes = ['Login', 'Undocking', 'Quantum Travel / Jumpgate', '30K', 'Desync', 'Elevators', 'Other'];

	function toggleType(type) {
		const types = data.issues.types ?? [];
		if (types.includes(type)) {
			data.issues.types = types.filter((t) => t !== type);
		} else {
			data.issues.types = [...types, type];
		}
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Issue type chips -->
	<div class="flex flex-col gap-1.5">
		<span class="text-sm text-gray-300">Issue Types</span>
		<div class="flex flex-wrap gap-1.5">
			{#each issueTypes as type}
				{@const active = (data.issues.types ?? []).includes(type)}
				<button
					onclick={() => toggleType(type)}
					class="rounded border px-2 py-1 text-xs font-medium transition-colors {active
						? 'border-primary-500 bg-primary-500/20 text-primary-300'
						: 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'}"
				>{type}</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-1">
		<label for="issues-problems" class="text-sm text-gray-300">Problems Encountered</label>
		<textarea
			id="issues-problems"
			bind:value={data.issues.problems}
			class="textarea min-h-[80px]"
			placeholder="Describe any problems encountered..."
		></textarea>
	</div>

	<div class="flex flex-col gap-1">
		<label for="issues-fix" class="text-sm text-gray-300">Brief Fix / Resolution</label>
		<textarea
			id="issues-fix"
			bind:value={data.issues.briefFix}
			class="textarea min-h-[80px]"
			placeholder="Describe any fixes or resolutions..."
		></textarea>
	</div>
</div>
