<script>
	import { injuries } from '$lib/stores.js';

	const injuryOptions = ['None', 'Tier 1', 'Tier 2', 'Tier 3', 'Unknown'];

	function setNone() {
		$injuries['head'] = 'None';
		$injuries['chest'] = 'None';
		$injuries['leftArm'] = 'None';
		$injuries['rightArm'] = 'None';
		$injuries['leftLeg'] = 'None';
		$injuries['rightLeg'] = 'None';
	}

	function setUnknown() {
		$injuries['head'] = 'Unknown';
		$injuries['chest'] = 'Unknown';
		$injuries['leftArm'] = 'Unknown';
		$injuries['rightArm'] = 'Unknown';
		$injuries['leftLeg'] = 'Unknown';
		$injuries['rightLeg'] = 'Unknown';
	}
</script>

<div class="rounded-lg border-2 border-black font-black text-lg uppercase flex flex-col">
	<span class="text-center w-full text-2xl">Injuries</span>

	<div class="mx-4 flex flex-row justify-between items-center">
		Head:
		<select
			class="border-2 border-black m-2 p-1 md:w-1/3 rounded-xl"
			bind:value={$injuries['head']}
		>
			{#each injuryOptions as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</div>
	<div class="mx-4 flex flex-row justify-between items-center">
		Chest:
		<select
			class="border-2 border-black m-2 p-1 md:w-1/3 rounded-xl"
			bind:value={$injuries['chest']}
		>
			{#each injuryOptions as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</div>
	<div class="mx-4 flex flex-row justify-between items-center">
		Left Arm:
		<select
			class="border-2 border-black m-2 p-1 md:w-1/3 rounded-xl"
			bind:value={$injuries['leftArm']}
		>
			{#each injuryOptions as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</div>
	<div class="mx-4 flex flex-row justify-between items-center">
		Right Arm:
		<select
			class="border-2 border-black m-2 p-1 md:w-1/3 rounded-xl"
			bind:value={$injuries['rightArm']}
		>
			{#each injuryOptions as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</div>
	<div class="mx-4 flex flex-row justify-between items-center">
		Left Leg:
		<select
			class="border-2 border-black m-2 p-1 md:w-1/3 rounded-xl"
			bind:value={$injuries['leftLeg']}
		>
			{#each injuryOptions as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</div>
	<div class="mx-4 flex flex-row justify-between items-center">
		Right Leg:
		<select
			class="border-2 border-black m-2 p-1 md:w-1/3 rounded-xl"
			bind:value={$injuries['rightLeg']}
		>
			{#each injuryOptions as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</div>
	<div class="flex flex-row items-center justify-center">
		<button class="border-2 border-black bg-white m-2 px-2 rounded-xl" on:click={() => setNone()}>
			Set None
		</button>
		<button
			class="border-2 border-black bg-white m-2 px-2 rounded-xl"
			on:click={() => setUnknown()}
		>
			Set Unknown
		</button>
	</div>
</div>
