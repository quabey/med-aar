<script>
	let { onclose } = $props();
</script>

<div class="flex flex-col gap-4">
	<p class="text-sm text-gray-400">
		Settings are now managed through the <a href="/admin" class="text-primary-400 hover:underline">Admin Panel</a>.
	</p>
	<div class="flex justify-end">
		<button class="btn btn-secondary" onclick={onclose}>Close</button>
	</div>
</div>
