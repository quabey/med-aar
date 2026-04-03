<script>
	import { successToast } from '$lib/state/toast.svelte.js';
	import { supabase } from '$lib/supabaseClient.js';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	const LS_NAME = 'medtools:copyPasteName';
	const LS_CUSTOM_FAVS = 'medtools:customFavorites';
	const LS_FAV_ORDER = 'medtools:favoriteOrder';
	const NAME_PLACEHOLDER = '[INSERT NAME HERE]';

	let sharedMessages = $state([]);
	let customMessages = $state([]);
	let favoriteIds = $state(new Set());
	let customFavoriteIds = $state(new Set());
	let favoriteOrder = $state([]);
	let loaded = $state(false);
	let showAdd = $state(false);
	let showSettings = $state(false);
	let editingFavorites = $state(false);
	let newLabel = $state('');
	let newText = $state('');
	let newCategory = $state('Custom');
	let collapsed = $state(false);
	let userName = $state(typeof window !== 'undefined' ? (localStorage.getItem(LS_NAME) || '') : '');

	function loadCustomFavorites() {
		try {
			const stored = localStorage.getItem(LS_CUSTOM_FAVS);
			if (stored) customFavoriteIds = new Set(JSON.parse(stored));
		} catch {}
	}

	function saveCustomFavorites() {
		localStorage.setItem(LS_CUSTOM_FAVS, JSON.stringify([...customFavoriteIds]));
	}

	function loadFavoriteOrder() {
		try {
			const stored = localStorage.getItem(LS_FAV_ORDER);
			if (stored) favoriteOrder = JSON.parse(stored);
		} catch {}
	}

	function saveFavoriteOrder() {
		localStorage.setItem(LS_FAV_ORDER, JSON.stringify(favoriteOrder));
	}

	async function loadData() {
		if (typeof window !== 'undefined') {
			loadCustomFavorites();
			loadFavoriteOrder();
		}
		const [sharedRes, favsRes, customRes] = await Promise.all([
			supabase.from('copypastes').select('*').order('sort_order', { ascending: true }),
			supabase.from('user_favorites').select('copypaste_id'),
			supabase.from('user_custom_pastes').select('*').order('sort_order', { ascending: true })
		]);
		if (sharedRes.data) sharedMessages = sharedRes.data;
		if (favsRes.data) favoriteIds = new Set(favsRes.data.map((f) => f.copypaste_id));
		if (customRes.data) customMessages = customRes.data;
		loaded = true;
	}

	if (typeof window !== 'undefined') loadData();

	function needsName(text) {
		return text.includes(NAME_PLACEHOLDER);
	}

	function saveName() {
		localStorage.setItem(LS_NAME, userName);
	}

	function isFavorited(id, isCustom) {
		return isCustom ? customFavoriteIds.has(id) : favoriteIds.has(id);
	}

	async function toggleFavorite(id, isCustom) {
		if (isCustom) {
			if (customFavoriteIds.has(id)) {
				customFavoriteIds.delete(id);
			} else {
				customFavoriteIds.add(id);
			}
			customFavoriteIds = new Set(customFavoriteIds);
			saveCustomFavorites();
		} else {
			if (favoriteIds.has(id)) {
				favoriteIds.delete(id);
				favoriteIds = new Set(favoriteIds);
				await supabase.from('user_favorites').delete().eq('copypaste_id', id);
			} else {
				favoriteIds.add(id);
				favoriteIds = new Set(favoriteIds);
				const { data } = await supabase.auth.getUser();
				if (data?.user) {
					await supabase.from('user_favorites').insert({ user_id: data.user.id, copypaste_id: id });
				}
			}
		}
	}

	function moveFavorite(index, direction) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= favoriteOrder.length) return;
		const temp = favoriteOrder[index];
		favoriteOrder[index] = favoriteOrder[newIndex];
		favoriteOrder[newIndex] = temp;
		favoriteOrder = [...favoriteOrder];
		saveFavoriteOrder();
	}

	function copyMessage(text, category) {
		let finalText = text;
		if (userName) {
			finalText = finalText.replaceAll(NAME_PLACEHOLDER, userName);
		}
		if (category === 'Status') {
			const ts = Math.floor(Date.now() / 1000);
			finalText = `${text} <t:${ts}:R>`;
		}
		navigator.clipboard.writeText(finalText).then(() => successToast('Copied!'));
	}

	async function addCustom() {
		if (!newLabel.trim() || !newText.trim()) return;
		const { data } = await supabase.auth.getUser();
		if (!data?.user) return;
		const { data: inserted, error } = await supabase
			.from('user_custom_pastes')
			.insert({ user_id: data.user.id, name: newLabel.trim(), category: newCategory.trim() || 'Custom', content: newText.trim() })
			.select()
			.single();
		if (!error && inserted) {
			customMessages = [...customMessages, inserted];
			newLabel = '';
			newText = '';
			newCategory = 'Custom';
			showAdd = false;
			successToast('Message added');
		}
	}

	async function deleteCustom(id) {
		const { error } = await supabase.from('user_custom_pastes').delete().eq('id', id);
		if (error) {
			console.error('Failed to delete custom paste:', error);
			return;
		}
		customMessages = customMessages.filter((m) => m.id !== id);
		successToast('Message deleted');
	}

	// Build unified message list: shared + custom
	const allMessages = $derived([
		...sharedMessages.map((m) => ({ id: m.id, category: m.category, label: m.name, text: m.content_normal, isCustom: false })),
		...customMessages.map((m) => ({ id: m.id, category: m.category, label: m.name, text: m.content, isCustom: true }))
	]);

	const favoritedMessages = $derived.by(() => {
		const favs = allMessages.filter((m) => isFavorited(m.id, m.isCustom));
		// Sync favoriteOrder: add new favorites, remove stale ones
		const favIdSet = new Set(favs.map((m) => m.id));
		const currentOrder = favoriteOrder.filter((id) => favIdSet.has(id));
		const missing = favs.filter((m) => !currentOrder.includes(m.id)).map((m) => m.id);
		if (missing.length || currentOrder.length !== favoriteOrder.length) {
			favoriteOrder = [...currentOrder, ...missing];
			saveFavoriteOrder();
		}
		// Sort by order
		const orderMap = new Map(favoriteOrder.map((id, i) => [id, i]));
		return [...favs].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
	});

	const categories = $derived([...new Set(allMessages.map((m) => m.category))]);
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b border-gray-700 px-3 py-2">
		<h3 class="font-Mohave text-sm font-semibold uppercase tracking-wider text-gray-300">
			Copy Pastes
		</h3>
		<div class="flex items-center gap-1">
			<button
				class="btn-sm btn-primary text-xs"
				onclick={() => (showAdd = !showAdd)}
				title="Add message"
			>
				+ New
			</button>
			<button
				class="rounded p-1 text-gray-400 transition-colors hover:text-white"
				onclick={() => (showSettings = !showSettings)}
				title="Settings"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</button>
			<button
				class="rounded p-1 text-gray-400 transition-colors hover:text-white"
				onclick={() => (collapsed = !collapsed)}
				title={collapsed ? 'Expand' : 'Collapse'}
			>
				<svg class="h-4 w-4 transition-transform {collapsed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
				</svg>
			</button>
		</div>
	</div>

	{#if !collapsed}
		<!-- Settings panel -->
		{#if showSettings}
			<div class="border-b border-gray-700 bg-gray-800/60 p-3 flex flex-col gap-2">
				<p class="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Settings</p>
				<div class="flex flex-col gap-1">
					<label for="cp-name" class="text-xs text-gray-400">Your name (replaces [INSERT NAME HERE])</label>
					<input
						id="cp-name"
						type="text"
						class="input text-xs"
						placeholder="Enter your name..."
						bind:value={userName}
						oninput={saveName}
					/>
				</div>
				<button class="btn-sm btn-outline text-xs self-end" onclick={() => (showSettings = false)}>Close</button>
			</div>
		{/if}

		<!-- Add new message form -->
		{#if showAdd}
			<div class="border-b border-gray-700 bg-gray-800/60 p-3 flex flex-col gap-2">
				<input
					type="text"
					class="input text-xs"
					placeholder="Category (e.g. Mission)"
					bind:value={newCategory}
				/>
				<input
					type="text"
					class="input text-xs"
					placeholder="Label"
					bind:value={newLabel}
				/>
				<textarea
					class="textarea min-h-[60px] text-xs"
					placeholder="Message text..."
					bind:value={newText}
				></textarea>
				<div class="flex gap-2">
					<button class="btn-sm btn-primary flex-1 text-xs" onclick={addCustom}>Save</button>
					<button class="btn-sm btn-outline flex-1 text-xs" onclick={() => (showAdd = false)}>Cancel</button>
				</div>
			</div>
		{/if}

		<!-- Messages: favorites section at top, then by category -->
		<div class="flex-1 overflow-y-auto p-2 pb-16">
			{#if !loaded}
				<LoadingSpinner message="Loading messages..." size="sm" />
			{:else}
				{#if favoritedMessages.length > 0}
					<div class="mb-3">
						<div class="mb-1 flex items-center justify-between px-1">
							<p class="text-[10px] font-semibold uppercase tracking-widest text-yellow-500/70">⭐ Favorites</p>
							<button
								class="text-[10px] font-medium transition-colors {editingFavorites ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}"
								onclick={() => (editingFavorites = !editingFavorites)}
							>{editingFavorites ? 'Done' : 'Edit'}</button>
						</div>
						{#each favoritedMessages as msg, i}
							<div class="mb-1 flex items-center gap-1 rounded bg-gray-700/40 px-2 py-1.5">
								{#if editingFavorites}
									<div class="flex flex-shrink-0 flex-col gap-0.5">
										<button
											class="rounded px-0.5 text-[10px] leading-none text-gray-400 transition-colors hover:text-white disabled:opacity-30"
											onclick={() => moveFavorite(i, -1)}
											disabled={i === 0}
											title="Move up"
										>▲</button>
										<button
											class="rounded px-0.5 text-[10px] leading-none text-gray-400 transition-colors hover:text-white disabled:opacity-30"
											onclick={() => moveFavorite(i, 1)}
											disabled={i === favoritedMessages.length - 1}
											title="Move down"
										>▼</button>
									</div>
								{/if}
								<button
									class="flex-shrink-0 text-base leading-none transition-colors text-yellow-400"
									onclick={() => toggleFavorite(msg.id, msg.isCustom)}
									title="Unfavorite"
								>★</button>
								<span class="flex-1 min-w-0 text-xs text-gray-200 truncate" title={msg.text}>{msg.label}</span>
								{#if needsName(msg.text) && !userName}
									<span class="relative group flex-shrink-0">
										<button
											class="btn-sm text-[10px] bg-gray-600 text-gray-400 cursor-not-allowed"
											disabled
										>Copy</button>
										<span class="pointer-events-none absolute bottom-full right-0 mb-1 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-gray-300 shadow-lg group-hover:block">Set your name in settings</span>
									</span>
								{:else}
									<button
										class="btn-sm btn-primary text-[10px] flex-shrink-0"
										onclick={() => copyMessage(msg.text, msg.category)}
									>Copy</button>
								{/if}
							</div>
						{/each}
					</div>
					<div class="mx-1 mb-3 h-px bg-gray-700"></div>
				{/if}
				{#each categories as category}
				<div class="mb-3">
					<p class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">{category}</p>
					{#each allMessages.filter((m) => m.category === category) as msg}
						<div class="mb-1 flex items-center gap-1 rounded bg-gray-700/40 px-2 py-1.5">
							<button
								class="flex-shrink-0 text-base leading-none transition-colors {isFavorited(msg.id, msg.isCustom) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}"
								onclick={() => toggleFavorite(msg.id, msg.isCustom)}
								title={isFavorited(msg.id, msg.isCustom) ? 'Unfavorite' : 'Favorite'}
							>★</button>
							<span class="flex-1 min-w-0 text-xs text-gray-200 truncate" title={msg.text}>{msg.label}</span>
							{#if needsName(msg.text) && !userName}
								<span class="relative group flex-shrink-0">
									<button
										class="btn-sm text-[10px] bg-gray-600 text-gray-400 cursor-not-allowed"
										disabled
									>Copy</button>
									<span class="pointer-events-none absolute bottom-full right-0 mb-1 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-gray-300 shadow-lg group-hover:block">Set your name in settings</span>
								</span>
							{:else}
								<button
									class="btn-sm btn-primary text-[10px] flex-shrink-0"
									onclick={() => copyMessage(msg.text, msg.category)}
								>Copy</button>
							{/if}
							{#if msg.isCustom}
								<button
									class="flex-shrink-0 rounded p-0.5 text-gray-600 transition-colors hover:text-red-400"
									onclick={() => deleteCustom(msg.id)}
									title="Delete"
								>
									<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
			{/if}
		</div>
	{/if}
</div>
