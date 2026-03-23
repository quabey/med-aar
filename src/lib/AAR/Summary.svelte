<script>
	let { data } = $props();
</script>

<div class="flex flex-col gap-1">
	<label for="summary" class="text-sm text-gray-300">Summary</label>
	<textarea
		id="summary"
		bind:value={data.summary}
		class="textarea min-h-[100px]"
		placeholder="Brief summary of the operation..."
	></textarea>
</div>
