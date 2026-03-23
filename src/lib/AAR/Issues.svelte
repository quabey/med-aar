<script>
	let { data } = $props();
</script>

<div class="flex flex-col gap-3">
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
