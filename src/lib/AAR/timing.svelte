<script>
	import { times } from '$lib/stores.js';
</script>

<div class="rounded-lg border-2 border-black font-black text-lg uppercase flex flex-col">
	<span class="text-center w-full text-2xl">Timing</span>
	<div class="mx-4 flex flex-row justify-between items-center">
		Alert received at:
		<input
			type="time"
			class="border-2 border-black m-2 p-1 rounded-xl"
			bind:value={$times['recevied']}
		/>
	</div>
	<div class="mx-4 flex flex-row justify-between items-center">
		Alert started at:
		<input
			type="time"
			class="border-2 border-black m-2 p-1 rounded-xl"
			bind:value={$times['start']}
		/>
	</div>
	<div class="mx-4 flex flex-row justify-between items-center">
		Station departed at:
		<input
			type="time"
			class="border-2 border-black m-2 p-1 rounded-xl"
			bind:value={$times['departed']}
		/>
	</div>
	<div class="mx-4 flex flex-row justify-between items-center">
		Reached Client at:
		<input
			type="time"
			class="border-2 border-black m-2 p-1 rounded-xl"
			bind:value={$times['reached']}
		/>
	</div>
	<div class="mx-4 flex flex-row justify-between items-center">
		Finished Alert at:
		<input
			type="time"
			class="border-2 border-black m-2 p-1 rounded-xl"
			bind:value={$times['completed']}
		/>
	</div>
</div>
