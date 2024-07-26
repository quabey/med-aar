<script>
	import { injuries } from '$lib/stores.js';
	import { Select, Label, Button, ButtonGroup } from 'flowbite-svelte';
	import { capitalizeFirstLetters } from '$lib/util.js';

	const injuryOptions = [
		{ value: 'None', name: 'None' },
		{ value: 'Tier 1', name: 'Tier 1' },
		{ value: 'Tier 2', name: 'Tier 2' },
		{ value: 'Tier 3', name: 'Tier 3' },
		{ value: 'Unknown', name: 'Unknown' }
	];

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

<div class="flex flex-col gap-2 rounded-lg">
	{#each ['head', 'chest', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'] as part}
		<div class="flex flex-row items-center justify-between">
			{ @html capitalizeFirstLetters(part.replace(/([A-Z])/g, ' $1')) }:
			<div class="">
				<Label>
					<Select class="" items={injuryOptions} bind:value={$injuries[part]} />
				</Label>
			</div>
		</div>
	{/each}

	<div class="flex flex-row items-center justify-center gap-3">
		<ButtonGroup>
			<Button on:click={setNone}>Set None</Button>
			<Button on:click={setUnknown}>Set Unknown</Button>
		</ButtonGroup>
	</div>
</div>
