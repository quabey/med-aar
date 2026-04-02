<script>
	let { message = 'Loading...', size = 'md' } = $props();

	const sizes = {
		sm: 'h-5 w-5',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	};
</script>

<div class="flex flex-col items-center justify-center gap-3 py-12">
	<div class="relative {sizes[size]}">
		<div
			class="absolute inset-0 rounded-full border-2 border-gray-700"
		></div>
		<div
			class="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary-400"
		></div>
	</div>
	{#if message}
		<p class="text-sm text-gray-400">{message}</p>
	{/if}
</div>
