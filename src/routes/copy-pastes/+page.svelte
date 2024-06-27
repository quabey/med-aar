<script>
	import { hasNitro, isMRBlack } from '$lib/stores.js';
	import { Toggle } from 'flowbite-svelte';
	import Status from '$lib/copy-pastes/Status.svelte';
</script>

<Toggle bind:value={$hasNitro}>Do you have discord Nitro?</Toggle>
<Toggle bind:value={$isMRBlack}>Medrunner Black</Toggle>

<Status />
