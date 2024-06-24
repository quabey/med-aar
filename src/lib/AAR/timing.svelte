<script>
	import { times } from '$lib/stores.js';
	import { Button, ButtonGroup } from 'flowbite-svelte';

	function setStartTime() {
		times.update((t) => {
			t['start'] = t['received'];
			t['departed'] = t['received'];
			t['reached'] = t['received'];
			t['completed'] = t['received'];
			return t;
		});
	}

	function setNow() {
		const now = new Date().toISOString().slice(0, 16);
		times.update((t) => {
			t['received'] = now;
			t['start'] = now;
			t['departed'] = now;
			t['reached'] = now;
			t['completed'] = now;
			return t;
		});
	}
</script>

<div class="flex flex-col gap-2">
	<span class="w-full gap-2 text-center text-2xl">Timing</span>
	{#each ['received', 'start', 'departed', 'reached', 'completed'] as time}
		<div class="mx-4 flex flex-row items-center justify-between">
			{time.charAt(0).toUpperCase() + time.slice(1)} at:
			<input
				type="time"
				class="rounded-lg border-none bg-primary-600 py-2 text-sm font-medium text-black dark:text-white"
				bind:value={times[time]}
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
