<script>
	import MessagePreview from '$lib/AAR/MessagePreview.svelte';
	import { sections, setAllDefault } from '$lib/stores.js';
	import { successToast, errorToast } from '$lib/toasts.js';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import Section from '$lib/AAR/section.svelte';
	import { Dropdown, Button, DropdownItem, ButtonGroup, Modal } from 'flowbite-svelte';
	import { PlusOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import CopyButton from '$lib/AAR/CopyButton.svelte';

	const sectionOptions = [
		'Injury',
		'Inaccuracy',
		'Difficulties',
		'Alert Breakdown',
		'Incident Report',
		'Accident Report',
		'Team Remarks',
		'Location',
		'Text 1',
		'Text 2',
		'Text 3'
	];

	let clearModal = false;
	let clearningMessage = 'sections';
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

	function actviateClearModel(type) {
		clearningMessage = type;
		clearModal = true;
	}

	function clearSectionContents() {
		setAllDefault();
		clearModal = false;
	}

	function executeClear() {
		switch (clearningMessage) {
			case 'sections':
				clearSections();
				break;
			case 'section contents':
				clearSectionContents();
				break;
			case 'section and set default sections':
				clearSectionContents();
				setDefaultSections();
				break;
			default:
				break;
		}
	}

	function clearSections() {
		$sections = [];
		clearModal = false;
	}

	function setDefaultSections() {
		$sections = [
			{ id: 0, name: 'ships' },
			{ id: 1, name: 'timing' },
			{ id: 2, name: 'location' },
			{ id: 3, name: 'alert breakdown' },
			{ id: 4, name: 'injury' },
			{ id: 5, name: 'extraction' }
		];
	}
</script>

<svelte:head>
	<title>Medrunner AAR</title>
</svelte:head>

<div class="flex justify-center pb-12">
	<div class="my-2 flex w-full flex-col items-center gap-2">
		<div class="flex flex-row items-center gap-5 py-2">
			<ButtonGroup class="scale-x-110 ">
				<Button on:click={() => (previewModal = true)}>See message</Button>
				<CopyButton />
			</ButtonGroup>
			<ButtonGroup class="scale-x-110 pl-7 pr-4">
				<Button class="" on:click={() => actviateClearModel('sections')}>Clear Section</Button>
				<Button class="" on:click={() => actviateClearModel('section contents')}>
					Clear Contents
				</Button>
				<Button class="" on:click={() => actviateClearModel('section and set default sections')}>
					Clear and set default sections</Button
				>
			</ButtonGroup>
			<Button class="">Abort Mode</Button>
		</div>
		<section
			use:dndzone={{ items: $sections, flipDurationMs, dropTargetStyle: {} }}
			on:consider={handleDndConsider}
			on:finalize={handleDndFinalize}
			class="gap-2"
		>
			{#each $sections as item (item.id)}
				<div animate:flip={{ duration: flipDurationMs }} class="border-none outline-none">
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
			Are you sure you want to clear all <b>{clearningMessage}</b>?
		</h3>
		<Button color="red" class="me-2" on:click={executeClear}>Yes, I'm sure</Button>
		<Button color="alternative" on:click={() => (clearModal = false)}>No, cancel</Button>
	</div>
</Modal>

<Modal bind:open={previewModal} size="lg" title="Preview Message">
	<MessagePreview />
</Modal>
