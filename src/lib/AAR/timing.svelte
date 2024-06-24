<script>
	import { times } from '$lib/stores.js';
	import { Button, ButtonGroup } from 'flowbite-svelte';

	function setStartTime() {
		$times = {
			received: $times['received'],
			start: $times['received'],
			departed: $times['received'],
			reached: $times['received'],
			completed: $times['received']
		};
	}

	// its in 24 hour format
	function setNow() {
		const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
		$times = {
			received: now,
			start: now,
			departed: now,
			reached: now,
			completed: now
		};
	}
</script>

<div class="flex flex-col gap-2">
	{#each ['received', 'start', 'departed', 'reached', 'completed'] as time}
		<div class=" flex flex-row items-center justify-between">
			{time.charAt(0).toUpperCase() + time.slice(1)} at:
			<input
				type="time"
				class="rounded-lg border-none bg-primary-600 py-2 text-sm font-medium text-black hover:bg-primary-600/90 dark:text-white"
				bind:value={$times[time]}
			/>
		</div>
	{/each}
	<div class="flex flex-row items-center justify-center gap-3">
		<ButtonGroup>
			<Button on:click={setStartTime} disabled={times['received'] == 'unknown'}>
				Set All to Received
			</Button>
			<Button class="" on:click={setNow}>Set Now to All</Button>
		</ButtonGroup>
	</div>
</div>

<style>
	input[type='time']::-webkit-calendar-picker-indicator {
		filter: invert(100%);
	}
</style>
