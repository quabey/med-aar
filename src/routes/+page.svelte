<script>
	import { tabStore } from '$lib/state/tabs.svelte.js';
	import { config } from '$lib/config/index.svelte.js';
	import TabBar from '$lib/components/TabBar.svelte';
	import TemplateSelector from '$lib/components/TemplateSelector.svelte';
	import Section from '$lib/AAR/section.svelte';
	import CopyButton from '$lib/AAR/CopyButton.svelte';
	import MessagePreview from '$lib/AAR/MessagePreview.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import AssignmentPanel from '$lib/components/AssignmentPanel.svelte';
	import CopyPastePanel from '$lib/components/CopyPastePanel.svelte';
	import { successToast } from '$lib/state/toast.svelte.js';

	let showAssignments = $state(true);
	let showCopyPaste = $state(true);
	let sidebarWidth = $state(
		typeof window !== 'undefined'
			? parseInt(localStorage.getItem('medtools:sidebarWidth') || '585', 10)
			: 585
	);
	let copyPasteWidth = $state(
		typeof window !== 'undefined'
			? parseInt(localStorage.getItem('medtools:copyPasteWidth') || '260', 10)
			: 260
	);
	let isResizing = $state(false);
	let isResizingCopyPaste = $state(false);

	function startResize(e) {
		isResizing = true;
		const startX = e.clientX;
		const startWidth = sidebarWidth;
		function onMove(ev) {
			const delta = startX - ev.clientX;
			sidebarWidth = Math.max(400, Math.min(900, startWidth + delta));
		}
		function onUp() {
			isResizing = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			localStorage.setItem('medtools:sidebarWidth', String(sidebarWidth));
		}
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	function startResizeCopyPaste(e) {
		isResizingCopyPaste = true;
		const startX = e.clientX;
		const startWidth = copyPasteWidth;
		function onMove(ev) {
			const delta = startX - ev.clientX;
			copyPasteWidth = Math.max(280, Math.min(500, startWidth + delta));
		}
		function onUp() {
			isResizingCopyPaste = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			localStorage.setItem('medtools:copyPasteWidth', String(copyPasteWidth));
		}
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	const sectionOptions = [
		'Alert Type',
		'Timing',
		'Ships',
		'Injury',
		'Inaccuracy',
		'Difficulties',
		'Alert Breakdown',
		'Incident Report',
		'Accident Report',
		'Team Remarks',
		'Location',
		'VOD',
		'Text 1',
		'Text 2',
		'Text 3',
		'Extraction',
		'Encounters',
		'Issues',
		'Result',
		'Summary'
	];

	let showPreview = $state(false);
	let showClearConfirm = $state(false);
	let clearType = $state('');
	let showAddSection = $state(false);

	function selectTemplate(templateId, alertName) {
		const template = config.templates[templateId];
		if (template) {
			tabStore.createTab(templateId, template.sections, alertName);
		}
	}

	function addSection(option) {
		const data = tabStore.activeData;
		if (!data) return;
		let id = data.sections.length;
		while (data.sections.find((s) => s.id === id)) id++;
		data.sections.push({ id, name: option.toLowerCase() });
		showAddSection = false;
	}

	function confirmClear(type) {
		clearType = type;
		showClearConfirm = true;
	}

	function executeClear() {
		const tab = tabStore.activeTab;
		if (!tab) return;
		switch (clearType) {
			case 'sections':
				tabStore.clearTabSections(tab.id);
				break;
			case 'contents':
				tabStore.resetTabData(tab.id);
				break;
			case 'all':
				tabStore.clearTabSections(tab.id);
				tabStore.resetTabData(tab.id);
				break;
		}
		showClearConfirm = false;
		successToast(`Cleared ${clearType}`);
	}
</script>

<svelte:head>
	<title>Medrunner AAR - Med-Tools</title>
	<meta property="og:title" content="Med-Tools" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://med-tools.space" />
</svelte:head>

<TabBar />

<div class="flex min-h-0 flex-1 overflow-hidden">
	<!-- Main AAR content -->
	<div class="flex-1 overflow-y-auto">
		{#if !tabStore.hasActiveTab}
			<TemplateSelector onselect={selectTemplate} />
		{:else if tabStore.activeData}
			<div class="relative flex justify-center gap-4 pb-12">
				<div class="my-4 flex w-full flex-col items-center gap-3">
					<!-- Sections -->
					<div class="w-full max-w-3xl px-4">
						{#if tabStore.activeData.sections.length > 0}
							<div class="flex flex-col gap-6">
								{#each tabStore.activeData.sections as item (item.id)}
									<Section
										sectionItem={item}
										data={tabStore.activeData}
									/>
								{/each}
							</div>
						{:else}
							<div class="py-12 text-center text-gray-500">
								<p class="text-lg">No sections yet</p>
								<p class="text-sm">Add sections using the floating toolbar</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Sticky action card (right side, stays in view while scrolling) -->
				<div class="sticky top-4 mt-4 mr-6 flex h-fit flex-col gap-2 rounded-xl border border-gray-700/50 bg-gray-800/95 p-3 shadow-2xl backdrop-blur-sm">
					<button class="btn btn-primary text-sm" onclick={() => (showPreview = true)}>
						Preview
					</button>
					<CopyButton data={tabStore.activeData} />
					<div class="h-px w-full bg-gray-600"></div>
					<div class="relative">
						<button
							class="btn btn-outline text-sm w-full flex items-center justify-center gap-1.5"
							onclick={() => (showAddSection = !showAddSection)}
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							Add Section
						</button>
						{#if showAddSection}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="fixed inset-0 z-40"
								onclick={() => (showAddSection = false)}
								onkeydown={() => {}}
							></div>
							<div
								class="absolute right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl"
							>
								{#each sectionOptions as option}
									{#if !tabStore.activeData.sections.find((s) => s.name === option.toLowerCase())}
										<button
											class="block w-full whitespace-nowrap px-4 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
											onclick={() => addSection(option)}
										>
											{option}
										</button>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
					<div class="h-px w-full bg-gray-600"></div>
					<button class="btn btn-outline text-sm" onclick={() => confirmClear('sections')}>
						Clear Sections
					</button>
					<button class="btn btn-outline text-sm" onclick={() => confirmClear('contents')}>
						Clear Contents
					</button>
					<button class="btn btn-outline text-sm" onclick={() => confirmClear('all')}>
						Reset All
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Assignments sidebar -->
	{#if showAssignments}
		<div class="relative flex flex-shrink-0 border-l border-gray-700 bg-gray-900" style="width: {sidebarWidth}px">
			<!-- Resize handle -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-primary-400/30 {isResizing ? 'bg-primary-400/40' : ''}"
				onmousedown={startResize}
			></div>
			<div class="flex-1 overflow-hidden">
				<AssignmentPanel />
			</div>
		</div>
	{/if}

	<!-- Copy-paste sidebar -->
	{#if showCopyPaste}
		<div class="relative flex flex-shrink-0 border-l border-gray-700 bg-gray-900" style="width: {copyPasteWidth}px">
			<!-- Resize handle -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-primary-400/30 {isResizingCopyPaste ? 'bg-primary-400/40' : ''}"
				onmousedown={startResizeCopyPaste}
			></div>
			<div class="flex-1 overflow-hidden">
				<CopyPastePanel />
			</div>
		</div>
	{/if}
</div>

<!-- Toggle assignments button -->
<button
	class="fixed bottom-4 right-4 z-50 rounded-full bg-gray-700 p-2.5 shadow-lg transition-colors hover:bg-gray-600"
	onclick={() => (showAssignments = !showAssignments)}
	title={showAssignments ? 'Hide Assignments' : 'Show Assignments'}
>
	<svg class="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
	</svg>
</button>

<!-- Toggle copy-paste button -->
<button
	class="fixed bottom-4 right-16 z-50 rounded-full bg-gray-700 p-2.5 shadow-lg transition-colors hover:bg-gray-600"
	onclick={() => (showCopyPaste = !showCopyPaste)}
	title={showCopyPaste ? 'Hide Copy Pastes' : 'Show Copy Pastes'}
>
	<svg class="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
	</svg>
</button>

<!-- Preview Modal -->
{#if showPreview}
	<Modal title="Preview AAR" onclose={() => (showPreview = false)} size="lg">
		<MessagePreview data={tabStore.activeData} />
	</Modal>
{/if}

<!-- Clear Confirmation Modal -->
{#if showClearConfirm}
	<Modal title="Confirm" onclose={() => (showClearConfirm = false)} size="sm">
		<div class="text-center">
			<svg
				class="mx-auto mb-4 h-12 w-12 text-yellow-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
				/>
			</svg>
			<p class="mb-6 text-gray-300">
				Are you sure you want to clear <span class="font-semibold text-white">{clearType}</span>? You can also create a new empty tab instead.
			</p>
			<div class="flex justify-center gap-3">
				<button class="btn btn-danger" onclick={executeClear}>Yes, clear</button>
				<button class="btn btn-primary" onclick={() => { tabStore.createTab('empty', [], null); showClearConfirm = false; successToast('New tab created'); }}>New Tab</button>
				<button class="btn btn-secondary" onclick={() => (showClearConfirm = false)}>
					Cancel
				</button>
			</div>
		</div>
	</Modal>
{/if}
