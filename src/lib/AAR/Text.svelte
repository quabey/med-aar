<script>
	import { texts } from '$lib/stores.js';
	import { Input, Label, Textarea, Button, ButtonGroup } from 'flowbite-svelte';
	import { toast } from 'svelte-french-toast';

	export let index;

	function clear(params) {
		$texts[index].title = '';
		$texts[index].content = '';
		toast.success('Cleared text', {
			style: 'background-color: #2c5278; color: white;',
			position: 'top-right'
		});
	}
</script>

<div class="flex flex-col gap-3">
	<div class="">
		<Label for="title" class="mb-2 text-sm font-medium text-black dark:text-white">Title</Label>
		<Input
			id="title"
			type="text"
			placeholder="Enter your title..."
			class="rounded-lg border-none bg-primary-600 py-2 text-sm font-medium text-black hover:bg-primary-600/90 dark:text-white"
			bind:value={$texts[index].title}
		/>
	</div>
	<div class="">
		<Label for="content" class="mb-2 text-sm font-medium text-black dark:text-white">Content</Label>
		<Textarea
			id="content"
			placeholder="Enter your content..."
			class="rounded-lg border-none bg-primary-600 py-2 text-sm font-medium text-black hover:bg-primary-600/90 dark:text-white"
			bind:value={$texts[index].content}
		/>
	</div>
	<div class="flex flex-row items-center justify-center gap-3">
		<ButtonGroup>
			<Button class="" on:click={clear}>Clear</Button>
		</ButtonGroup>
	</div>
</div>
