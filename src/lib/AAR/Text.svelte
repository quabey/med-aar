<script>
	import { successToast } from '$lib/state/toast.svelte.js';

	let { data, index } = $props();

	function clear() {
		data.texts[index].title = '';
		data.texts[index].content = '';
		successToast('Cleared text');
	}
</script>

<div class="flex flex-col gap-3">
	<div>
		<label for="text-title-{index}" class="mb-1 block text-sm text-gray-400">Title</label>
		<input
			id="text-title-{index}"
			type="text"
			bind:value={data.texts[index].title}
			class="input w-full"
			placeholder="Enter title..."
		/>
	</div>
	<div>
		<label for="text-content-{index}" class="mb-1 block text-sm text-gray-400">Content</label>
		<textarea
			id="text-content-{index}"
			bind:value={data.texts[index].content}
			class="textarea w-full"
			rows="6"
			placeholder="Enter content..."
		></textarea>
	</div>
	<div class="flex justify-center">
		<button class="btn btn-secondary text-sm" onclick={clear}>Clear</button>
	</div>
</div>
