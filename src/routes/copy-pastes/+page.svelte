<script>
	import { hasNitro, isMRBlack } from '$lib/stores.js';
	import Status from '$lib/copy-pastes/Status.svelte';
</script>

<div class="mx-auto max-w-2xl space-y-4 p-4">
	<label class="flex items-center gap-3 text-gray-300">
		<input type="checkbox" class="checkbox" bind:checked={$hasNitro} />
		Do you have discord Nitro?
	</label>
	<label class="flex items-center gap-3 text-gray-300">
		<input type="checkbox" class="checkbox" bind:checked={$isMRBlack} />
		Medrunner Black
	</label>
	<Status />
</div>
