<script>
	import { injuries } from '$lib/stores.js';
	import { Dropdown, DropdownItem, Button, ButtonGroup } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';

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

<div class="flex flex-col gap-2 rounded-lg">
	<span class="w-full text-center text-2xl">Injuries</span>

	{#each ['head', 'chest', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'] as part}
		<div class="mx-4 flex flex-row items-center justify-between">
			{@html part.charAt(0).toUpperCase() + part.slice(1)}:
			<div class="">
				<Button size="sm">
					{$injuries[part] || `Select ${part.charAt(0).toUpperCase() + part.slice(1)} Injury`}
					<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
				</Button>
				<Dropdown class="" bind:value={$injuries[part]}>
					{#each injuryOptions as option}
						<DropdownItem
							on:click={() => {
								$injuries[part] = option;
							}}
						>
							{option}
						</DropdownItem>
					{/each}
				</Dropdown>
			</div>
		</div>
	{/each}

	<div class="flex flex-row items-center justify-center gap-3">
		<ButtonGroup>
			<Button on:click={() => setNone()}>Set None</Button>
			<Button class="" on:click={() => setUnknown()}>Set Unknown</Button>
		</ButtonGroup>
	</div>
</div>
