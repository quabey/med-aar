<script>
	let { data } = $props();
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center gap-3">
		<label class="flex items-center gap-2 text-sm text-gray-300">
			<input type="checkbox" class="checkbox" bind:checked={data.intersystemResponse.required} />
			Intersystem Response Required
		</label>
	</div>

	{#if data.intersystemResponse.required}
		<div class="flex flex-col gap-1">
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
