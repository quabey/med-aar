<script>
	import PlusSvg from '$lib/svg/plus-svg.svelte';

	import { sections, dndItems } from '$lib/stores.js';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import Section from '../../lib/AAR/section.svelte';

	const sectionOptions = [
		'Injury',
		'Inqccuracy',
		'Difficulties',
		'Alert Breakdown',
		'Accident Report',
		'Team Remarks'
	];

	let selectedSection = sectionOptions[0]; // Set a default value

	let extraSections = ['Injury'];
	let newSection = false;

	function addSection() {
		if (selectedSection) {
			extraSections = [...extraSections, selectedSection];
			newSection = false;
			console.log(extraSections);
		}
	}

	const flipDurationMs = 300;
	function handleDndConsider(e) {
		dndItems.set(e.detail.items);
	}
	function handleDndFinalize(e) {
		dndItems.set(e.detail.items);
	}
</script>

<div class="flex justify-center">
	<div class="my-2 flex w-full flex-col items-center gap-2">
		<div class="flex flex-col items-center p-2">
			<h1 class="text-center text-4xl font-black">Medrunner AAR</h1>
			<div class="">
				<button class="rounded-xl border-2 border-black bg-white px-2 text-lg font-black">
					See message
				</button>
				<button class="rounded-xl border-2 border-black bg-white px-2 text-lg font-black">
					Copy message
				</button>
				<button class="rounded-xl border-2 border-black bg-white px-2 text-lg font-black">
					Abort Mode
				</button>
			</div>
		</div>
		<section
			use:dndzone={{ items: $dndItems, flipDurationMs }}
			on:consider={handleDndConsider}
			on:finalize={handleDndFinalize}
			class="gap-2"
		>
			{#each $dndItems as item (item.id)}
				<div animate:flip={{ duration: flipDurationMs }}>
					<Section sectionIndex={item} />
				</div>
			{/each}
		</section>
		{#if !newSection}
			<button
				class="flex h-24 flex-col items-center rounded-lg border-2 border-black p-2"
				on:click={() => (newSection = true)}
			>
				<span class="text-lg font-black">Add new section</span>
				<PlusSvg />
			</button>
		{:else}
			<div class="flex flex-col items-center rounded-lg border-2 border-black p-2">
				<select class="m-2 w-1/3 rounded-xl border-2 border-black p-1" bind:value={selectedSection}>
					{#each sectionOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
				<button
					class="flex w-1/3 flex-col items-center rounded-lg border-2 border-black bg-white text-lg font-black"
					on:click={addSection}
				>
					Add Section
				</button>
			</div>
		{/if}
	</div>
</div>
