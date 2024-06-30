<script>
	import { Textarea } from 'flowbite-svelte';
	import { incidentReport } from '$lib/stores.js';
</script>

<div class="">
	<Textarea
		id="incidentReport"
		placeholder="Write the incident Report here..."
		class=""
		rows="16"
		bind:value={$incidentReport}
	/>
</div>
