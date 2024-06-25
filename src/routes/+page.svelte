<script>
	import MessagePreview from '$lib/AAR/MessagePreview.svelte';
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
		'Team Remarks',
		'Location',
		'Text 1',
		'Text 2',
		'Text 3'
	];

	let clearModal = false;
	let previewModal = false;

	function addSection(option) {
		let id = $sections.length + 1;
		while ($sections.find((section) => section.id === id)) {
			id++;
		}
		$sections = [...$sections, { id, name: option.toLowerCase() }];
	}

	const flipDurationMs = 300;
	function handleDndConsider(e) {
		sections.set(e.detail.items);
	}
	function handleDndFinalize(e) {
		sections.set(e.detail.items);
	}

	function clearSections() {
		$sections = [];
		clearModal = false;
	}
</script>

<svelte:head>
	<title>Medrunner AAR</title>
</svelte:head>

<div class="flex justify-center pb-12">
	<div class="my-2 flex w-full flex-col items-center gap-2">
		<div class="flex flex-col items-center p-2">
			<ButtonGroup class="mt-2 scale-x-110">
				<Button on:click={() => (previewModal = true)}>See message</Button>
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

<Modal bind:open={clearModal} size="xs" autoclose>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you sure you want to clear all sections?
		</h3>
		<Button color="red" class="me-2" on:click={clearSections}>Yes, I'm sure</Button>
		<Button color="alternative" on:click={() => (clearModal = false)}>No, cancel</Button>
	</div>
</Modal>

<Modal bind:open={previewModal} size="lg" title="Preview Message">
	<MessagePreview />
</Modal>
