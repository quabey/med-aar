<script>
	import { copy } from '$lib/copy-pastes/helper.js';
	import { Button, ButtonGroup } from 'flowbite-svelte';
</script>

<ButtonGroup>
	<Button on:click={() => copy('Status')}>Copy Status</Button>
</ButtonGroup>
