<script>
	let { title = '', onclose, children, size = 'md' } = $props();

	function handleBackdrop(e) {
		if (e.target === e.currentTarget) onclose?.();
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') onclose?.();
	}

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-2xl',
		lg: 'max-w-4xl',
		xl: 'max-w-6xl'
	};
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
	onclick={handleBackdrop}
>
	<div
		class="mx-4 max-h-[90vh] w-full overflow-y-auto rounded-xl bg-gray-800 shadow-2xl {sizeClasses[
			size
		] ?? sizeClasses.md}"
	>
		{#if title}
			<div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
				<h3 class="font-Mohave text-xl font-semibold text-white">{title}</h3>
				<button
					onclick={onclose}
					aria-label="Close"
					class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		{/if}
		<div class="p-5">
			{@render children()}
		</div>
	</div>
</div>
