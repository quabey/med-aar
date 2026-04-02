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

	function toggleOffsetMode() {
		data.times.offsetMode = !data.times.offsetMode;
		if (typeof window !== 'undefined') {
			localStorage.setItem('medtools:timingOffsetMode', String(data.times.offsetMode));
		}
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Mode toggle -->
	<div class="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2">
		<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Mode</span>
		<div class="flex rounded-lg border border-gray-600 bg-gray-900 p-0.5">
			<button
				class="rounded px-3 py-1 text-xs font-semibold transition-colors {!data.times.offsetMode ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}"
				onclick={() => { if (data.times.offsetMode) toggleOffsetMode(); }}
			>Timestamps</button>
			<button
				class="rounded px-3 py-1 text-xs font-semibold transition-colors {data.times.offsetMode ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}"
				onclick={() => { if (!data.times.offsetMode) toggleOffsetMode(); }}
			>Offsets</button>
		</div>
	</div>

	{#if data.times.offsetMode}
		<!-- Offset mode: 4 number inputs for minute offsets -->
		<div class="grid grid-cols-2 gap-3">
			{#each [{ key: 'offsetAlert', label: 'Alert', placeholder: '0' }, { key: 'offsetDepart', label: 'Depart', placeholder: '5' }, { key: 'offsetClient', label: 'Client', placeholder: '15' }, { key: 'offsetRTB', label: 'RTB', placeholder: '25' }] as field}
				<div class="flex flex-col gap-1">
					<label for="offset-{field.key}" class="text-sm text-gray-300">{field.label}</label>
					<div class="flex items-center gap-1.5">
						<input
							id="offset-{field.key}"
							type="number"
							min="0"
							bind:value={data.times[field.key]}
							class="input w-full"
							placeholder={field.placeholder}
						/>
						<span class="text-xs text-gray-500">min</span>
					</div>
				</div>
			{/each}
		</div>
		<p class="text-center text-xs text-gray-500">Minutes from alert start (T+0)</p>
	{:else}
		<!-- Timestamp mode -->
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
	{/if}
</div>

<style>
	input[type='time']::-webkit-calendar-picker-indicator {
		filter: invert(100%);
	}
</style>
