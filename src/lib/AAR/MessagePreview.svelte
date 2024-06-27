<script>
	import { toast } from 'svelte-french-toast';
	import { Button, Textarea } from 'flowbite-svelte';
	import { createMessage } from '$lib/AAR/message.js';

	function copy() {
		try {
			navigator.clipboard.writeText(finalMessage);
			toast.success('Message copied', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
		} catch (error) {
			toast.error('Error copying message, try view the message instead', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
		}
	}

	let finalMessage = createMessage();

	function addwatermark() {
		finalMessage = finalMessage + '\n' + 'Made with med-tools.space';
	}
</script>

<div class="">
	<Textarea
		id="message"
		placeholder="Message Preview..."
		class=""
		rows="16"
		bind:value={finalMessage}
	/>
	<Button on:click={copy}>Copy Message</Button>
	<Button on:click={addwatermark}>Add Watermark</Button>
</div>
