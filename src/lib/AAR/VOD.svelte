<script>
	let { data } = $props();
</script>

<div class="flex flex-col gap-3">
	<div>
		<label for="vod-url" class="mb-1 block text-sm text-gray-400">VOD Link</label>
		<input
			id="vod-url"
			type="url"
			bind:value={data.vod.url}
			class="input w-full"
			placeholder="Paste link here..."
		/>
	</div>
	<label class="flex items-center gap-2 text-sm text-gray-300">
		<input type="checkbox" bind:checked={data.vod.timestamps} class="checkbox" />
		VOD has timestamps
	</label>
	<label class="flex items-center gap-2 text-sm text-gray-300">
		<input type="checkbox" bind:checked={data.vod.commsAllowed} class="checkbox" />
		Allowed to use for media department
	</label>
</div>
