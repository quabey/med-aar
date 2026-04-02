<script>
	import { tabStore } from '$lib/state/tabs.svelte.js';

	let showHistory = $state(false);
	let historyButtonEl = $state(null);
	let editingTabId = $state(null);
	let editName = $state('');

	function startRename(tab) {
		editingTabId = tab.id;
		editName = tab.name;
	}

	function finishRename() {
		if (editingTabId && editName.trim()) {
			tabStore.renameTab(editingTabId, editName.trim());
		}
		editingTabId = null;
		editName = '';
	}

	function handleRenameKey(e) {
		if (e.key === 'Enter') finishRename();
		if (e.key === 'Escape') {
			editingTabId = null;
			editName = '';
		}
	}
</script>

<div class="relative z-30 border-b border-gray-700 bg-gray-800/50">
	<div class="flex items-center gap-1 px-4 py-1">
		<div class="flex flex-1 items-center gap-1 overflow-x-auto">
			{#each tabStore.tabs as tab (tab.id)}
				<div
					class="group flex items-center gap-1 rounded-t-lg px-3 py-2 text-sm transition-colors
						{tab.id === tabStore.activeTabId
						? 'bg-gray-700 text-white'
						: 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}"
				>
					{#if editingTabId === tab.id}
						<input
							type="text"
							bind:value={editName}
							onkeydown={handleRenameKey}
							onblur={finishRename}
							class="w-24 rounded border-none bg-gray-600 px-1 py-0.5 text-xs text-white focus:ring-1 focus:ring-primary-400"
						/>
					{:else}
						<button
							class="max-w-32 truncate text-left"
							onclick={() => tabStore.switchTab(tab.id)}
							ondblclick={() => startRename(tab)}
						>
							{tab.name}
						</button>
					{/if}
					<button
						class="ml-1 rounded p-0.5 text-gray-500 opacity-0 transition-opacity hover:bg-gray-600 hover:text-white group-hover:opacity-100"
						onclick={(e) => {
							e.stopPropagation();
							tabStore.closeTab(tab.id);
						}}
						title="Close tab"
					>
						✕
					</button>
				</div>
			{/each}

			<!-- New Tab Button -->
			<button
				class="flex items-center gap-1 rounded-t-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-white"
				onclick={() => (tabStore.activeTabId = null)}
				title="New AAR"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
			</button>
		</div>

		<!-- History Button (outside the scrollable area) -->
		{#if tabStore.closedTabs.length > 0}
			<button
				bind:this={historyButtonEl}
				class="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
				onclick={() => (showHistory = !showHistory)}
			>
				<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				History ({tabStore.closedTabs.length})
			</button>
		{/if}
	</div>
</div>

<!-- History dropdown rendered outside the tab bar via fixed positioning -->
{#if showHistory}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-[100]" onclick={() => (showHistory = false)} onkeydown={() => {}}></div>
	<div
		class="fixed right-4 z-[101] w-64 rounded-lg border border-gray-600 bg-gray-700 p-2 shadow-2xl"
		style="top: {historyButtonEl ? historyButtonEl.getBoundingClientRect().bottom + 4 : 48}px"
	>
		<div class="mb-2 flex items-center justify-between text-xs text-gray-400">
			<span>Recently Closed</span>
			<button class="hover:text-white" onclick={() => tabStore.clearHistory()}>
				Clear
			</button>
		</div>
		{#each tabStore.closedTabs.slice(0, 10) as tab (tab.id)}
			<button
				class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-600"
				onclick={() => {
					tabStore.reopenTab(tab.id);
					showHistory = false;
				}}
			>
				<span class="truncate">{tab.name}</span>
				<span class="ml-2 text-xs text-gray-500">
					{new Date(tab.closedAt).toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit'
					})}
				</span>
			</button>
		{/each}
	</div>
{/if}
