<script>
	import { settings, defaultSections } from '$lib/stores.js';
	import { Toggle, Button } from 'flowbite-svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { formatName } from '$lib/util.js';

	// Drag & Drop Stuff
	const flipDurationMs = 300;
	function handleDndConsider(e) {
		defaultSections.set(e.detail.items);
	}
	function handleDndFinalize(e) {
		defaultSections.set(e.detail.items);
	}
</script>

<div class="flex flex-row">
	<div class="w-1/2">
		{#each Object.keys($settings) as setting}
			<Toggle bind:checked={$settings[setting]} class="my-1">
				{formatName(setting)}
			</Toggle>
		{/each}
	</div>
	<div class="w-1/2">
		<span>Default Sections (Drag & Drop)</span>
		<div>Not yet implemented</div>
	</div>
</div>
<div class="">
	<div class="text-sm">You need to save the settings for them to persist across sessions.</div>
	<div class="">
		<Button>Save</Button>
	</div>
</div>
