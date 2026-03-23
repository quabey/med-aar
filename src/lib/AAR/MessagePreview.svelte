<script>
	import { successToast, errorToast } from '$lib/state/toast.svelte.js';
	import { createMessage } from '$lib/AAR/message.js';

	let { data } = $props();
	let finalMessage = $state('');

	$effect(() => {
		finalMessage = createMessage(data);
	});

	function copy() {
		try {
			navigator.clipboard.writeText(finalMessage);
			successToast('Message copied to clipboard');
		} catch {
			errorToast('Failed to copy message');
		}
	}

	function refresh() {
		finalMessage = createMessage(data);
	}

	function addWatermark() {
		finalMessage += '\nMade with [med-tools.space](https://med-tools.space)';
	}
</script>

<div class="flex flex-col gap-3">
	<textarea bind:value={finalMessage} class="textarea w-full font-mono text-sm" rows="16"></textarea>
	<div class="flex gap-2">
		<button class="btn btn-primary" onclick={copy}>Copy Message</button>
		<button class="btn btn-secondary" onclick={refresh}>Refresh</button>
		<button class="btn btn-outline" onclick={addWatermark}>Add Watermark</button>
	</div>
</div>
