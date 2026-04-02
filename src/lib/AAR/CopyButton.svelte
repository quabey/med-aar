<script>
	import { successToast, errorToast } from '$lib/state/toast.svelte.js';
	import { createMessage } from '$lib/AAR/message.js';

	let { data } = $props();

	function copyMessage() {
		try {
			const message = createMessage(data);
			navigator.clipboard.writeText(message);
			successToast('AAR copied to clipboard');
		} catch {
			errorToast('Failed to copy — try the preview instead');
		}
	}
</script>

<button class="btn btn-primary" onclick={copyMessage}>Copy AAR</button>
