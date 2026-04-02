<script>
	import { config } from '$lib/config/index.svelte.js';
	import Modal from '$lib/components/Modal.svelte';
	import { successToast, errorToast } from '$lib/state/toast.svelte.js';
	import { supabase } from '$lib/supabaseClient.js';

	let activeEditor = $state('users');
	let saving = $state(false);

	// Editor state
	let editingAlertType = $state({ name: '', value: '' });
	let editingShip = $state({ name: '', value: '', category: 'medical' });
	let editingLocation = $state({ name: '', type: '', planetary_body: '' });

	// Users state
	let users = $state([]);
	let usersLoading = $state(true);
	let userFilter = $state('pending');

	// Copypastes state
	let copypastes = $state([]);
	let copypastesLoading = $state(true);
	let editingPaste = $state(null);
	let showPasteModal = $state(false);
	let newPaste = $state({ name: '', category: '', content_normal: '', sort_order: 0 });

	// Ships state (DB-backed)
	let dbShips = $state([]);
	let shipsLoading = $state(true);

	// Templates state (DB-backed)
	let dbTemplates = $state([]);
	let templatesLoading = $state(true);
	let editingTemplate = $state(null);
	let showTemplateModal = $state(false);
	let newTemplate = $state({ key: '', name: '', description: '', icon: '📋', recommended: false, sections: [] });
	let newSectionName = $state('');

	// Locations state (DB-backed)
	let dbLocations = $state([]);
	let locationsLoading = $state(true);
	let locationSearch = $state('');

	// Staff Lookup state
	let staffInput = $state('');
	let staffResults = $state([]);
	let staffLoading = $state(false);

	const availableSections = [
		'alert breakdown', 'alert type', 'encounters', 'extraction',
		'incident report', 'injury', 'intersystem response', 'issues',
		'location', 'result', 'ships', 'summary', 'text', 'timing', 'vod'
	];

	// ── Data loading ────────────────────────────────────────
	async function loadUsers() {
		usersLoading = true;
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.order('created_at', { ascending: false });
		if (!error && data) users = data;
		else if (error) errorToast('Failed to load users');
		usersLoading = false;
	}

	async function loadCopypastes() {
		copypastesLoading = true;
		const { data, error } = await supabase
			.from('copypastes')
			.select('*')
			.order('sort_order', { ascending: true });
		if (!error && data) copypastes = data;
		else if (error) errorToast('Failed to load copypastes');
		copypastesLoading = false;
	}

	async function loadShips() {
		shipsLoading = true;
		const { data, error } = await supabase
			.from('ships')
			.select('*')
			.order('category')
			.order('sort_order');
		if (!error && data) dbShips = data;
		else if (error) errorToast('Failed to load ships');
		shipsLoading = false;
	}

	async function loadTemplates() {
		templatesLoading = true;
		const { data, error } = await supabase
			.from('templates')
			.select('*')
			.order('sort_order');
		if (!error && data) dbTemplates = data;
		else if (error) errorToast('Failed to load templates');
		templatesLoading = false;
	}

	async function loadLocations() {
		locationsLoading = true;
		const { data, error } = await supabase
			.from('locations')
			.select('*')
			.order('name');
		if (!error && data) dbLocations = data;
		else if (error) errorToast('Failed to load locations');
		locationsLoading = false;
	}

	$effect(() => {
		const tab = activeEditor;
		if (tab === 'users') loadUsers();
		if (tab === 'copypastes') loadCopypastes();
		if (tab === 'ships') loadShips();
		if (tab === 'templates') loadTemplates();
		if (tab === 'locations') loadLocations();
	});

	const filteredUsers = $derived(
		userFilter === 'all' ? users : users.filter((u) => u.approval_status === userFilter)
	);

	const filteredLocations = $derived(
		locationSearch
			? dbLocations.filter((l) => l.name.toLowerCase().includes(locationSearch.toLowerCase()))
			: dbLocations
	);

	// ── Users CRUD ──────────────────────────────────────────
	async function approveUser(userId) {
		const { error } = await supabase
			.from('profiles')
			.update({ is_approved: true, approval_status: 'approved' })
			.eq('id', userId);
		if (error) return errorToast('Failed to approve user');
		successToast('User approved');
		loadUsers();
	}

	async function rejectUser(userId) {
		const { error } = await supabase
			.from('profiles')
			.update({ is_approved: false, approval_status: 'rejected' })
			.eq('id', userId);
		if (error) return errorToast('Failed to reject user');
		successToast('User rejected');
		loadUsers();
	}

	async function toggleAdmin(userId, currentlyAdmin) {
		const { error } = await supabase
			.from('profiles')
			.update({ is_admin: !currentlyAdmin })
			.eq('id', userId);
		if (error) return errorToast('Failed to update admin status');
		successToast(currentlyAdmin ? 'Admin removed' : 'Admin granted');
		loadUsers();
	}

	// ── Copypaste CRUD ──────────────────────────────────────
	function openNewPaste() {
		editingPaste = null;
		newPaste = { name: '', category: '', content_normal: '', sort_order: 0 };
		showPasteModal = true;
	}

	function openEditPaste(paste) {
		editingPaste = paste;
		newPaste = { name: paste.name, category: paste.category, content_normal: paste.content_normal, sort_order: paste.sort_order };
		showPasteModal = true;
	}

	async function savePaste() {
		if (!newPaste.name.trim() || !newPaste.content_normal.trim()) return errorToast('Name and content required');
		if (editingPaste) {
			const { error } = await supabase
				.from('copypastes')
				.update({ name: newPaste.name, category: newPaste.category, content_normal: newPaste.content_normal, sort_order: newPaste.sort_order })
				.eq('id', editingPaste.id);
			if (error) return errorToast('Failed to update');
			successToast('Copypaste updated');
		} else {
			const { error } = await supabase
				.from('copypastes')
				.insert({ name: newPaste.name, category: newPaste.category || 'Custom', content_normal: newPaste.content_normal, sort_order: newPaste.sort_order });
			if (error) return errorToast('Failed to create');
			successToast('Copypaste created');
		}
		showPasteModal = false;
		loadCopypastes();
	}

	async function deletePaste(id) {
		const { error } = await supabase.from('copypastes').delete().eq('id', id);
		if (error) return errorToast('Failed to delete');
		successToast('Copypaste deleted');
		loadCopypastes();
	}

	// ── Alert Types (site_config) ───────────────────────────
	async function saveAlertTypes() {
		saving = true;
		try {
			const ok = await config.saveAlertTypes();
			if (ok) successToast('Alert types saved');
			else errorToast('Failed to save');
		} catch {
			errorToast('Failed to save');
		}
		saving = false;
	}

	function addAlertType() {
		if (!editingAlertType.name) return;
		const types = [...config.alertTypes, { ...editingAlertType, value: editingAlertType.value || editingAlertType.name }];
		config.updateAlertTypes(types);
		editingAlertType = { name: '', value: '' };
		successToast('Alert type added — remember to save');
	}

	function removeAlertType(index) {
		config.updateAlertTypes(config.alertTypes.filter((_, i) => i !== index));
	}

	// ── Ships (DB CRUD) ─────────────────────────────────────
	async function addShipToDB() {
		if (!editingShip.name) return;
		const { error } = await supabase.from('ships').insert({
			name: editingShip.name,
			value: editingShip.value || editingShip.name,
			category: editingShip.category,
			sort_order: dbShips.filter((s) => s.category === editingShip.category).length
		});
		if (error) return errorToast('Failed to add ship');
		successToast('Ship added');
		editingShip = { name: '', value: '', category: editingShip.category };
		loadShips();
		config.reload();
	}

	async function removeShipFromDB(id) {
		const { error } = await supabase.from('ships').delete().eq('id', id);
		if (error) return errorToast('Failed to remove ship');
		successToast('Ship removed');
		loadShips();
		config.reload();
	}

	// ── Locations (DB CRUD) ─────────────────────────────────
	async function addLocationToDB() {
		if (!editingLocation.name) return;
		const { error } = await supabase.from('locations').insert({
			name: editingLocation.name,
			type: editingLocation.type || '',
			planetary_body: editingLocation.planetary_body || '',
			sort_order: dbLocations.length
		});
		if (error) return errorToast('Failed to add location');
		successToast('Location added');
		editingLocation = { name: '', type: '', planetary_body: '' };
		loadLocations();
		config.reload();
	}

	async function removeLocationFromDB(id) {
		const { error } = await supabase.from('locations').delete().eq('id', id);
		if (error) return errorToast('Failed to remove location');
		successToast('Location removed');
		loadLocations();
		config.reload();
	}

	// ── Templates (DB CRUD with modal) ──────────────────────
	function openNewTemplate() {
		editingTemplate = null;
		newTemplate = { key: '', name: '', description: '', icon: '📋', recommended: false, sections: [] };
		showTemplateModal = true;
	}

	function openEditTemplate(tmpl) {
		editingTemplate = tmpl;
		newTemplate = {
			key: tmpl.key || '',
			name: tmpl.name,
			description: tmpl.description || '',
			icon: tmpl.icon || '📋',
			recommended: tmpl.recommended || false,
			sections: [...(tmpl.sections || [])]
		};
		showTemplateModal = true;
	}

	function addSectionToTemplate() {
		if (!newSectionName) return;
		const id = newTemplate.sections.length > 0
			? Math.max(...newTemplate.sections.map((s) => s.id)) + 1
			: 0;
		newTemplate.sections = [...newTemplate.sections, { id, name: newSectionName }];
		newSectionName = '';
	}

	function removeSectionFromTemplate(index) {
		newTemplate.sections = newTemplate.sections.filter((_, i) => i !== index);
	}

	function moveSectionUp(index) {
		if (index === 0) return;
		const sections = [...newTemplate.sections];
		[sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
		newTemplate.sections = sections;
	}

	function moveSectionDown(index) {
		if (index >= newTemplate.sections.length - 1) return;
		const sections = [...newTemplate.sections];
		[sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
		newTemplate.sections = sections;
	}

	async function saveTemplate() {
		if (!newTemplate.name.trim()) return errorToast('Name required');
		const payload = {
			key: newTemplate.key || null,
			name: newTemplate.name,
			description: newTemplate.description,
			icon: newTemplate.icon,
			recommended: newTemplate.recommended,
			sections: newTemplate.sections,
			sort_order: editingTemplate ? editingTemplate.sort_order : dbTemplates.length
		};
		if (editingTemplate) {
			const { error } = await supabase.from('templates').update(payload).eq('id', editingTemplate.id);
			if (error) return errorToast('Failed to update template');
			successToast('Template updated');
		} else {
			const { error } = await supabase.from('templates').insert(payload);
			if (error) return errorToast('Failed to create template');
			successToast('Template created');
		}
		showTemplateModal = false;
		loadTemplates();
		config.reload();
	}

	async function deleteTemplate(id) {
		const { error } = await supabase.from('templates').delete().eq('id', id);
		if (error) return errorToast('Failed to delete template');
		successToast('Template deleted');
		loadTemplates();
		config.reload();
	}

	// ── Staff Lookup ────────────────────────────────────────
	async function lookupStaff() {
		const ids = staffInput
			.split(/[,\n]/)
			.map((s) => s.trim())
			.filter(Boolean);
		if (!ids.length) return;
		staffLoading = true;
		try {
			const res = await fetch(`/api/admin/staff-lookup?discord_ids=${encodeURIComponent(ids.join(','))}`);
			const data = await res.json();
			if (data.error) errorToast(data.error);
			else staffResults = data.results || [];
		} catch {
			errorToast('Lookup failed');
		}
		staffLoading = false;
	}

	function timeAgo(ts) {
		if (!ts) return 'never';
		let d;
		if (ts > 1e16) d = new Date((ts - 621355968000000000) / 10000);
		else if (ts > 1e12) d = new Date(ts);
		else d = new Date(ts * 1000);
		const diff = Date.now() - d.getTime();
		const days = Math.floor(diff / 86400000);
		if (days < 1) return 'today';
		if (days === 1) return '1 day ago';
		if (days < 30) return `${days} days ago`;
		const months = Math.floor(days / 30);
		if (months === 1) return '1 month ago';
		if (months < 12) return `${months} months ago`;
		const years = Math.floor(months / 12);
		return years === 1 ? '1 year ago' : `${years} years ago`;
	}

	function formatDate(ts) {
		if (!ts) return '-';
		let d;
		if (ts > 1e16) d = new Date((ts - 621355968000000000) / 10000);
		else if (ts > 1e12) d = new Date(ts);
		else d = new Date(ts * 1000);
		return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	const editors = [
		{ key: 'users', label: 'Users' },
		{ key: 'copypastes', label: 'Copypastes' },
		{ key: 'alertTypes', label: 'Alert Types' },
		{ key: 'ships', label: 'Ships' },
		{ key: 'locations', label: 'Locations' },
		{ key: 'templates', label: 'Templates' },
		{ key: 'staffLookup', label: 'Staff Lookup' }
	];
</script>

<svelte:head>
	<title>Admin - Med-Tools</title>
</svelte:head>

<div class="mx-auto max-w-5xl overflow-y-auto p-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="font-Mohave text-3xl font-bold text-white">Admin Panel</h1>
		{#if activeEditor === 'alertTypes'}
			<button
				class="btn btn-primary text-sm"
				onclick={saveAlertTypes}
				disabled={saving}
			>
				{saving ? 'Saving...' : 'Save Alert Types'}
			</button>
		{/if}
	</div>

	<!-- Tabs -->
	<div class="mb-6 flex gap-1 overflow-x-auto border-b border-gray-700">
		{#each editors as editor}
			<button
				class="whitespace-nowrap px-4 py-2 text-sm transition-colors {activeEditor === editor.key
					? 'border-b-2 border-primary-400 text-white'
					: 'text-gray-400 hover:text-gray-200'}"
				onclick={() => (activeEditor = editor.key)}
			>
				{editor.label}
			</button>
		{/each}
	</div>

	<!-- ═══ Users ═══ -->
	{#if activeEditor === 'users'}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-200">Users</h2>
				<div class="flex gap-1">
					{#each [{ key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: 'all', label: 'All' }] as f}
						<button
							class="rounded px-3 py-1 text-xs transition-colors {userFilter === f.key ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
							onclick={() => (userFilter = f.key)}
						>{f.label}</button>
					{/each}
				</div>
			</div>
			{#if usersLoading}
				<p class="text-sm text-gray-400">Loading...</p>
			{:else if filteredUsers.length === 0}
				<p class="text-sm text-gray-500 italic">No users found.</p>
			{:else}
				<div class="rounded-lg border border-gray-700 bg-gray-800/50">
					{#each filteredUsers as user}
						<div class="flex items-center justify-between border-b border-gray-700/50 px-4 py-3 last:border-b-0">
							<div class="flex items-center gap-3">
								{#if user.discord_avatar}
									<img src={user.discord_avatar} alt="" class="h-8 w-8 rounded-full" />
								{:else}
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-xs text-gray-300">?</div>
								{/if}
								<div>
									<span class="text-sm font-medium text-gray-200">{user.discord_username || 'Unknown'}</span>
									<span class="ml-2 text-xs text-gray-500">{user.discord_id}</span>
									{#if user.is_admin}
										<span class="ml-2 rounded bg-yellow-600/30 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-400">ADMIN</span>
									{/if}
								</div>
							</div>
							<div class="flex items-center gap-2">
								<span class="rounded px-2 py-0.5 text-xs {user.approval_status === 'approved' ? 'bg-green-600/20 text-green-400' : user.approval_status === 'rejected' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}">
									{user.approval_status}
								</span>
								{#if user.approval_status === 'pending'}
									<button class="btn-sm text-xs bg-green-600 hover:bg-green-500 text-white" onclick={() => approveUser(user.id)}>Approve</button>
									<button class="btn-sm text-xs bg-red-600 hover:bg-red-500 text-white" onclick={() => rejectUser(user.id)}>Reject</button>
								{:else if user.approval_status === 'rejected'}
									<button class="btn-sm text-xs bg-green-600 hover:bg-green-500 text-white" onclick={() => approveUser(user.id)}>Approve</button>
								{:else}
									<button class="btn-sm text-xs bg-red-600/80 hover:bg-red-500 text-white" onclick={() => rejectUser(user.id)}>Revoke</button>
								{/if}
								<button
									class="btn-sm text-xs {user.is_admin ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-600 hover:bg-gray-500'} text-white"
									onclick={() => toggleAdmin(user.id, user.is_admin)}
								>{user.is_admin ? 'Remove Admin' : 'Make Admin'}</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ═══ Copypastes ═══ -->
	{#if activeEditor === 'copypastes'}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-200">Shared Copypastes ({copypastes.length})</h2>
				<button class="btn btn-primary text-sm" onclick={openNewPaste}>+ Add Copypaste</button>
			</div>
			{#if copypastesLoading}
				<p class="text-sm text-gray-400">Loading...</p>
			{:else}
				<div class="rounded-lg border border-gray-700 bg-gray-800/50">
					{#each copypastes as paste}
						<div class="flex items-center justify-between border-b border-gray-700/50 px-4 py-2 last:border-b-0">
							<div class="min-w-0 flex-1">
								<span class="text-sm font-medium text-gray-200">{paste.name}</span>
								<span class="ml-2 text-xs text-gray-500">{paste.category}</span>
								{#if paste.is_default}
									<span class="ml-1 text-[10px] text-gray-600">default</span>
								{/if}
							</div>
							<div class="flex gap-2">
								<button class="text-xs text-blue-400 hover:text-blue-300" onclick={() => openEditPaste(paste)}>Edit</button>
								<button class="text-xs text-red-400 hover:text-red-300" onclick={() => deletePaste(paste.id)}>Delete</button>
							</div>
						</div>
					{/each}
					{#if copypastes.length === 0}
						<div class="px-4 py-3 text-sm text-gray-500 italic">No copypastes yet.</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- ═══ Alert Types ═══ -->
	{#if activeEditor === 'alertTypes'}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-200">Alert Types</h2>
				<button class="btn-sm btn-outline" onclick={() => { config.resetAlertTypesToDefaults(); successToast('Reset to defaults — remember to save'); }}>Reset to Defaults</button>
			</div>
			<div class="rounded-lg border border-gray-700 bg-gray-800/50">
				{#each config.alertTypes as type, i}
					<div class="flex items-center justify-between border-b border-gray-700/50 px-4 py-2 last:border-b-0">
						<span class="text-sm text-gray-200">{type.name}</span>
						<button class="text-xs text-red-400 hover:text-red-300" onclick={() => removeAlertType(i)}>Remove</button>
					</div>
				{/each}
			</div>
			<div class="flex gap-2">
				<input type="text" bind:value={editingAlertType.name} class="input flex-1" placeholder="Alert type name..." />
				<button class="btn btn-primary text-sm" onclick={addAlertType}>Add</button>
			</div>
		</div>
	{/if}

	<!-- ═══ Ships ═══ -->
	{#if activeEditor === 'ships'}
		<div class="space-y-6">
			<h2 class="text-lg font-semibold text-gray-200">Ships</h2>

			{#if shipsLoading}
				<p class="text-sm text-gray-400">Loading...</p>
			{:else}
				{#each ['medical', 'combat', 'cap'] as category}
					<div>
						<h3 class="mb-2 text-sm font-semibold uppercase text-gray-400">{category} Ships ({dbShips.filter((s) => s.category === category).length})</h3>
						<div class="rounded-lg border border-gray-700 bg-gray-800/50">
							{#each dbShips.filter((s) => s.category === category) as ship}
								<div class="flex items-center justify-between border-b border-gray-700/50 px-4 py-2 last:border-b-0">
									<span class="text-sm text-gray-200">{ship.name}</span>
									<button class="text-xs text-red-400 hover:text-red-300" onclick={() => removeShipFromDB(ship.id)}>Remove</button>
								</div>
							{/each}
							{#if !dbShips.some((s) => s.category === category)}
								<div class="px-4 py-2 text-sm text-gray-500 italic">No ships</div>
							{/if}
						</div>
					</div>
				{/each}
			{/if}

			<div class="flex gap-2">
				<select bind:value={editingShip.category} class="select w-32">
					<option value="medical">Medical</option>
					<option value="combat">Combat</option>
					<option value="cap">CAP</option>
				</select>
				<input type="text" bind:value={editingShip.name} class="input flex-1" placeholder="Ship name..." />
				<button class="btn btn-primary text-sm" onclick={addShipToDB}>Add</button>
			</div>
		</div>
	{/if}

	<!-- ═══ Locations ═══ -->
	{#if activeEditor === 'locations'}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-200">Locations ({dbLocations.length})</h2>
			</div>

			{#if locationsLoading}
				<p class="text-sm text-gray-400">Loading...</p>
			{:else}
				<input
					type="text"
					bind:value={locationSearch}
					class="input w-full"
					placeholder="Filter locations by name..."
				/>

				<div class="max-h-96 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800/50">
					{#each filteredLocations as loc}
						<div class="flex items-center justify-between border-b border-gray-700/50 px-4 py-2 last:border-b-0">
							<div>
								<span class="text-sm text-gray-200">{loc.name}</span>
								{#if loc.type}
									<span class="ml-2 text-xs text-gray-500">{loc.type}</span>
								{/if}
								{#if loc.planetary_body}
									<span class="ml-1 text-xs text-gray-600">({loc.planetary_body})</span>
								{/if}
							</div>
							<button class="text-xs text-red-400 hover:text-red-300" onclick={() => removeLocationFromDB(loc.id)}>Remove</button>
						</div>
					{/each}
					{#if filteredLocations.length === 0}
						<div class="px-4 py-2 text-sm text-gray-500 italic">No locations found.</div>
					{/if}
				</div>
			{/if}

			<div class="flex gap-2">
				<input type="text" bind:value={editingLocation.name} class="input flex-1" placeholder="Location name..." />
				<input type="text" bind:value={editingLocation.type} class="input w-40" placeholder="Type..." />
				<button class="btn btn-primary text-sm" onclick={addLocationToDB}>Add</button>
			</div>
		</div>
	{/if}

	<!-- ═══ Templates ═══ -->
	{#if activeEditor === 'templates'}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-200">Templates ({dbTemplates.length})</h2>
				<button class="btn btn-primary text-sm" onclick={openNewTemplate}>+ Add Template</button>
			</div>

			{#if templatesLoading}
				<p class="text-sm text-gray-400">Loading...</p>
			{:else}
				{#each dbTemplates as tmpl}
					<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
						<div class="mb-2 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="text-lg">{tmpl.icon}</span>
								<span class="font-semibold text-gray-200">{tmpl.name}</span>
								{#if tmpl.recommended}
									<span class="rounded bg-green-600/20 px-1.5 py-0.5 text-[10px] text-green-400">Recommended</span>
								{/if}
								{#if tmpl.key}
									<span class="text-xs text-gray-500">{tmpl.key}</span>
								{/if}
							</div>
							<div class="flex gap-2">
								<button class="text-xs text-blue-400 hover:text-blue-300" onclick={() => openEditTemplate(tmpl)}>Edit</button>
								<button class="text-xs text-red-400 hover:text-red-300" onclick={() => deleteTemplate(tmpl.id)}>Delete</button>
							</div>
						</div>
						<p class="mb-2 text-sm text-gray-400">{tmpl.description}</p>
						<div class="flex flex-wrap gap-1">
							{#each tmpl.sections || [] as section}
								<span class="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">{section.name}</span>
							{/each}
							{#if !tmpl.sections?.length}
								<span class="text-xs text-gray-500 italic">No sections</span>
							{/if}
						</div>
					</div>
				{/each}
				{#if dbTemplates.length === 0}
					<p class="text-sm text-gray-500 italic">No templates yet.</p>
				{/if}
			{/if}
		</div>
	{/if}

	<!-- ═══ Staff Lookup ═══ -->
	{#if activeEditor === 'staffLookup'}
		<div class="space-y-4">
			<h2 class="text-lg font-semibold text-gray-200">Staff Lookup</h2>
			<p class="text-sm text-gray-400">Enter Discord ID(s) to look up their last alert activity. Separate multiple IDs with commas or newlines.</p>

			<div class="flex gap-2">
				<textarea
					bind:value={staffInput}
					class="textarea flex-1 font-mono text-sm"
					rows="3"
					placeholder="309333315738009610&#10;123456789012345678"
				></textarea>
				<button
					class="btn btn-primary self-start text-sm"
					onclick={lookupStaff}
					disabled={staffLoading}
				>
					{staffLoading ? 'Looking up...' : 'Lookup'}
				</button>
			</div>

			{#if staffResults.length > 0}
				<div class="rounded-lg border border-gray-700 bg-gray-800/50">
					{#each staffResults as staff}
						<div class="flex items-center justify-between border-b border-gray-700/50 px-4 py-3 last:border-b-0">
							<div>
								<span class="font-medium text-gray-200">
									{staff.rsiHandle || staff.discordId}
								</span>
								{#if staff.rsiHandle}
									<span class="ml-2 text-xs text-gray-500">{staff.discordId}</span>
								{/if}
							</div>
							<div class="text-right text-sm">
								{#if staff.alertCount > 0}
									<span class="text-gray-300">
										last alert {formatDate(staff.lastAlertTimestamp)}
									</span>
									<span class="ml-2 text-gray-500">
										({timeAgo(staff.lastAlertTimestamp)})
									</span>
									<span class="ml-2 text-xs text-gray-600">
										{staff.alertCount} alert{staff.alertCount !== 1 ? 's' : ''} total
									</span>
								{:else}
									<span class="text-gray-500 italic">No alerts found</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Copypaste Edit/Create Modal -->
{#if showPasteModal}
	<Modal title={editingPaste ? 'Edit Copypaste' : 'New Copypaste'} onclose={() => (showPasteModal = false)} size="lg">
		<div class="space-y-4">
			<div>
				<label class="mb-1 block text-sm text-gray-400">Name
				<input type="text" bind:value={newPaste.name} class="input w-full" placeholder="Message name..." />
				</label>
			</div>
			<div class="flex gap-4">
				<div class="flex-1">
					<label class="mb-1 block text-sm text-gray-400">Category
					<input type="text" bind:value={newPaste.category} class="input w-full" placeholder="e.g. Greetings" />
					</label>
				</div>
				<div class="w-24">
					<label class="mb-1 block text-sm text-gray-400">Sort Order
					<input type="number" bind:value={newPaste.sort_order} class="input w-full" />
					</label>
				</div>
			</div>
			<div>
				<label class="mb-1 block text-sm text-gray-400">Content
				<textarea bind:value={newPaste.content_normal} class="textarea w-full font-mono text-sm" rows="8" placeholder="Message text..."></textarea>
				</label>
			</div>
			<div class="flex justify-end gap-2">
				<button class="btn btn-secondary" onclick={() => (showPasteModal = false)}>Cancel</button>
				<button class="btn btn-primary" onclick={savePaste}>{editingPaste ? 'Update' : 'Create'}</button>
			</div>
		</div>
	</Modal>
{/if}

<!-- Template Edit/Create Modal -->
{#if showTemplateModal}
	<Modal title={editingTemplate ? 'Edit Template' : 'New Template'} onclose={() => (showTemplateModal = false)} size="lg">
		<div class="space-y-4">
			<div class="flex gap-4">
				<div class="flex-1">
					<label class="mb-1 block text-sm text-gray-400">Name
					<input type="text" bind:value={newTemplate.name} class="input w-full" placeholder="Template name..." />
					</label>
				</div>
				<div class="w-24">
					<label class="mb-1 block text-sm text-gray-400">Icon
					<input type="text" bind:value={newTemplate.icon} class="input w-full text-center text-lg" placeholder="📋" />
					</label>
				</div>
			</div>
			<div class="flex gap-4">
				<div class="flex-1">
					<label class="mb-1 block text-sm text-gray-400">Key (optional, e.g. "official")
					<input type="text" bind:value={newTemplate.key} class="input w-full font-mono text-sm" placeholder="unique-key" />
					</label>
				</div>
				<div class="flex items-end pb-1">
					<label class="flex items-center gap-2 text-sm text-gray-400">
						<input type="checkbox" bind:checked={newTemplate.recommended} class="rounded" />
						Recommended
					</label>
				</div>
			</div>
			<div>
				<label class="mb-1 block text-sm text-gray-400">Description
				<input type="text" bind:value={newTemplate.description} class="input w-full" placeholder="What this template is for..." />
				</label>
			</div>

			<!-- Sections editor -->
			<div>
				<label class="mb-2 block text-sm text-gray-400">Sections</label>
				{#if newTemplate.sections.length > 0}
					<div class="mb-3 rounded-lg border border-gray-700 bg-gray-800/50">
						{#each newTemplate.sections as section, i}
							<div class="flex items-center justify-between border-b border-gray-700/50 px-4 py-2 last:border-b-0">
								<div class="flex items-center gap-2">
									<span class="text-xs text-gray-500">{i + 1}.</span>
									<span class="text-sm text-gray-200">{section.name}</span>
								</div>
								<div class="flex items-center gap-1">
									<button
										class="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30"
										onclick={() => moveSectionUp(i)}
										disabled={i === 0}
									>↑</button>
									<button
										class="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30"
										onclick={() => moveSectionDown(i)}
										disabled={i >= newTemplate.sections.length - 1}
									>↓</button>
									<button class="text-xs text-red-400 hover:text-red-300" onclick={() => removeSectionFromTemplate(i)}>Remove</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="mb-3 text-sm text-gray-500 italic">No sections added yet.</p>
				{/if}
				<div class="flex gap-2">
					<select bind:value={newSectionName} class="select flex-1 text-sm">
						<option value="">Select a section...</option>
						{#each availableSections as sec}
							<option value={sec}>{sec}</option>
						{/each}
					</select>
					<button class="btn btn-secondary text-sm" onclick={addSectionToTemplate}>Add Section</button>
				</div>
			</div>

			<div class="flex justify-end gap-2">
				<button class="btn btn-secondary" onclick={() => (showTemplateModal = false)}>Cancel</button>
				<button class="btn btn-primary" onclick={saveTemplate}>{editingTemplate ? 'Update' : 'Create'}</button>
			</div>
		</div>
	</Modal>
{/if}
