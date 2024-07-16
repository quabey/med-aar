<script>
	import { vod } from '$lib/stores.js';
	import { Input, Checkbox } from 'flowbite-svelte';
</script>

<div class="flex flex-col gap-2">
	<label for="vodinput">Link</label>
	<Input id="vodinput" bind:value={$vod.url} placeholder="Paste Link here" />
	<Checkbox bind:checked={$vod.timestamps} label="">VOD has Timestamps</Checkbox>
	<Checkbox bind:checked={$vod.commsAllowed} label="">Allowed to use for media department</Checkbox>
</div>
