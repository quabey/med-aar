<script>
	let { data } = $props();
</script>

<div>
	<textarea
		bind:value={data.incidentReport}
		class="textarea w-full"
		rows="10"
		placeholder="Write the incident report here..."
	></textarea>
</div>
