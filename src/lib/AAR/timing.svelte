<script>
	let { data } = $props();

	const timeFields = ['received', 'start', 'departed', 'reached', 'completed'];

	function setNow(field) {
		data.times[field] = new Date().toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function setNowToAll() {
		const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
		for (const field of timeFields) {
			data.times[field] = now;
		}
	}

	function setAllToReceived() {
		if (!data.times.received) return;
		for (const field of timeFields) {
			data.times[field] = data.times.received;
		}
	}

	function capitalize(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>

<div class="flex flex-col gap-3">
	{#each timeFields as field}
		<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
			<label for="time-{field}" class="text-sm text-gray-300">{capitalize(field)} at:</label>
			<div class="flex items-center gap-2">
				<button
					class="btn-sm btn-outline"
					onclick={() => (data.times[field] = null)}
				>
					Clear
				</button>
				<button class="btn-sm btn-outline" onclick={() => setNow(field)}>
					Now
				</button>
				<input
					id="time-{field}"
					type="time"
					bind:value={data.times[field]}
					class="input w-32"
				/>
			</div>
		</div>
	{/each}
	<div class="flex justify-center gap-2 pt-2">
		<button class="btn btn-secondary text-sm" onclick={setAllToReceived} disabled={!data.times.received}>
			Set All to Received
		</button>
		<button class="btn btn-secondary text-sm" onclick={setNowToAll}>
			Set Now to All
		</button>
	</div>
</div>

<style>
	input[type='time']::-webkit-calendar-picker-indicator {
		filter: invert(100%);
	}
</style>
