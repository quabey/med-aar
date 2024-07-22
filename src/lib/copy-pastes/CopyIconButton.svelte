<script>
	import { hasNitro, isReply } from '$lib/stores.js';
	import { Button } from 'flowbite-svelte';
	import { FileCopyOutline, FileCopySolid } from 'flowbite-svelte-icons';

	export let paste;
	let copied = false;

	function copy() {
		console.log($hasNitro, $isReply, paste);
		let text = paste.normal;
		if ($hasNitro && paste.nitro) {
			text = paste.nitro;
		}
		if ($isReply && paste.reply) {
			text = `/reply message:${text}`;
		}
		navigator.clipboard.writeText(text).then(() => {
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 500);
		});
	}
</script>

<button class="hover:scale-110" on:click={copy}>
	{#if copied}
		<FileCopySolid class="h-6 w-6 text-white" />
	{:else}
		<FileCopyOutline class="h-6 w-6 text-white" />
	{/if}
</button>
