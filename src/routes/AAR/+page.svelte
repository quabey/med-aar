<script>
	import { sections } from '$lib/stores.js';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import Section from '$lib/AAR/section.svelte';
	import { Dropdown, Button, DropdownItem, ButtonGroup, Modal } from 'flowbite-svelte';
	import { PlusOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import CopyButton from '$lib/AAR/CopyButton.svelte';
	const sectionOptions = [
		'Injury',
		'Inqccuracy',
		'Difficulties',
		'Alert Breakdown',
		'Accident Report',
		'Team Remarks'
	];

	function addSection(option) {
		$sections = [...$sections, { id: $sections.length + 1, name: option.toLowerCase() }];
	}
	const flipDurationMs = 300;
	function handleDndConsider(e) {
		sections.set(e.detail.items);
	}
	function handleDndFinalize(e) {
		sections.set(e.detail.items);
	}
</script>

<svelte:head>
	<title>Medrunner AAR</title>
</svelte:head>

<div class="flex justify-center pb-12">
	<div class="my-2 flex w-full flex-col items-center gap-2">
		<div class="flex flex-col items-center p-2">
			<h1 class="text-center text-4xl font-black">Medrunner AAR Tool (Unofficial)</h1>
			<ButtonGroup class="mt-2 scale-x-110">
				<Button>See message</Button>
				<CopyButton />
				<Button class="">Abort Mode</Button>
				<Button class="" on:click={() => (clearModal = true)}>Clear</Button>
			</ButtonGroup>
		</div>
		<section
			use:dndzone={{ items: $sections, flipDurationMs }}
			on:consider={handleDndConsider}
			on:finalize={handleDndFinalize}
			class="gap-2"
		>
			{#each $sections as item (item.id)}
				<div animate:flip={{ duration: flipDurationMs }}>
					<Section sectionIndex={item} />
				</div>
			{/each}
		</section>
		<div class="">
			<Button>
				Add Section
				<PlusOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
			</Button>
			<Dropdown placement="top">
				{#each sectionOptions as option}
					<DropdownItem
						on:click={() => {
							addSection(option);
						}}
					>
						{option}
					</DropdownItem>
				{/each}
			</Dropdown>
		</div>
	</div>
</div>
