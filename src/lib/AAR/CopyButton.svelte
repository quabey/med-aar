<script>
	import { toast } from 'svelte-french-toast';
	import { Button } from 'flowbite-svelte';
	import { createMessage } from '$lib/AAR/message.js';

	function copyMessage() {
		try {
			let message = createMessage();
			console.log(message);
			navigator.clipboard.writeText(message);
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
</script>

<Button on:click={copyMessage}>Copy AAR</Button>
