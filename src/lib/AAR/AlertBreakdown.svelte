<script>
	import { Textarea } from 'flowbite-svelte';
	import { alertBreakdown } from '$lib/stores.js';
</script>

<div class="">
	<Textarea
		id="alertBreakdown"
		placeholder="Write the incident report here..."
		class=""
		rows="16"
		bind:value={$alertBreakdown}
	/>
</div>
