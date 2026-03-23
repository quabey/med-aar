<script>
	import { getToasts, removeToast } from '$lib/state/toast.svelte.js';

	const toasts = $derived(getToasts());
</script>

{#if toasts.length > 0}
	<div class="fixed right-4 top-4 z-[100] flex flex-col gap-2">
		{#each toasts as toast (toast.id)}
			<div
				class="flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all
					{toast.type === 'success'
					? 'bg-primary-600 text-white'
					: toast.type === 'error'
						? 'bg-red-600 text-white'
						: 'bg-gray-700 text-white'}"
			>
				{#if toast.type === 'success'}
					<svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				{:else if toast.type === 'error'}
					<svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				{/if}
				<span class="text-sm font-medium">{toast.message}</span>
				<button
					class="ml-2 rounded p-0.5 text-white/70 hover:text-white"
					onclick={() => removeToast(toast.id)}
				>
					✕
				</button>
			</div>
		{/each}
	</div>
{/if}
