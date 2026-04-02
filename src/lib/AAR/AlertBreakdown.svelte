<script>
	let { data } = $props();
</script>

<div>
	<textarea
		bind:value={data.alertBreakdown}
		class="textarea w-full"
		rows="10"
		placeholder="Write the alert breakdown here..."
	></textarea>
</div>
