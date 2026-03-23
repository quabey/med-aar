<script>
	import { config } from '$lib/config/index.svelte.js';
	import Modal from '$lib/components/Modal.svelte';
	import { successToast, errorToast } from '$lib/state/toast.svelte.js';

	let authenticated = $state(false);
	let passwordInput = $state('');
	let adminPassword = $state('');
	let activeEditor = $state('alertTypes');
	let showImportModal = $state(false);
	let importJson = $state('');
	let saving = $state(false);

	// Editor state
	let editingAlertType = $state({ name: '', value: '' });
	let editingShip = $state({ name: '', value: '', category: 'medical' });
	let editingLocation = $state({ name: '', type: '' });

	// Template editor
	let editingTemplateKey = $state('');
	let editingTemplate = $state({ name: '', description: '', icon: '', sections: [] });

	async function login() {
		if (!passwordInput) return;
		try {
			const res = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password: passwordInput })
			});
			if (res.ok) {
				adminPassword = passwordInput;
				authenticated = true;
				passwordInput = '';
				successToast('Logged in');
			} else {
				errorToast('Incorrect password');
			}
		} catch {
			errorToast('Failed to connect to server');
		}
	}

	function logout() {
		authenticated = false;
		adminPassword = '';
	}

	function handlePasswordKey(e) {
		if (e.key === 'Enter') login();
	}

	async function saveConfig() {
		saving = true;
		try {
			const ok = await config.save(adminPassword);
			if (ok) {
				successToast('Config saved to server');
			} else {
				errorToast('Failed to save — check your password');
			}
		} catch {
			errorToast('Failed to save config');
		}
		saving = false;
	}

	// Alert Types
	function addAlertType() {
		if (!editingAlertType.name) return;
		const types = [...config.alertTypes, { ...editingAlertType, value: editingAlertType.value || editingAlertType.name }];
		config.updateAlertTypes(types);
		editingAlertType = { name: '', value: '' };
		successToast('Alert type added — remember to save');
	}

	function removeAlertType(index) {
		const types = config.alertTypes.filter((_, i) => i !== index);
		config.updateAlertTypes(types);
	}

	// Ships
	function addShip() {
		if (!editingShip.name) return;
		const ships = { ...config.ships };
		const cat = editingShip.category;
		ships[cat] = [...(ships[cat] || []), { name: editingShip.name, value: editingShip.value || editingShip.name }];
		config.updateShips(ships);
		editingShip = { name: '', value: '', category: cat };
		successToast('Ship added — remember to save');
	}

	function removeShip(category, index) {
		const ships = { ...config.ships };
		ships[category] = ships[category].filter((_, i) => i !== index);
		config.updateShips(ships);
	}

	// Locations
	function addLocation() {
		if (!editingLocation.name) return;
		const id = Math.max(0, ...config.locations.map((l) => l.id || 0)) + 1;
		const locs = [...config.locations, { id, ...editingLocation }];
		config.updateLocations(locs);
		editingLocation = { name: '', type: '' };
		successToast('Location added — remember to save');
	}

	function removeLocation(index) {
		const locs = config.locations.filter((_, i) => i !== index);
		config.updateLocations(locs);
	}

	// Import/Export
	function exportConfig() {
		const json = config.exportAll();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'medtools-config.json';
		a.click();
		URL.revokeObjectURL(url);
		successToast('Config exported');
	}

	async function doImport() {
		try {
			config.importAll(importJson);
			showImportModal = false;
			importJson = '';
			successToast('Config imported locally — remember to save');
		} catch {
			errorToast('Invalid JSON');
		}
	}

	function resetSection(key) {
		config.resetToDefaults(key);
		successToast(`${key} reset to defaults — remember to save`);
	}

	const editors = [
		{ key: 'alertTypes', label: 'Alert Types' },
		{ key: 'ships', label: 'Ships' },
		{ key: 'locations', label: 'Locations' },
		{ key: 'templates', label: 'Templates' }
	];
</script>

<svelte:head>
	<title>Admin - Med-Tools</title>
</svelte:head>

<div class="mx-auto max-w-5xl overflow-y-auto p-6">
	{#if !authenticated}
		<!-- Login -->
		<div class="flex min-h-[50vh] items-center justify-center">
			<div class="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-800 p-6">
				<h2 class="mb-4 text-center font-Mohave text-2xl font-bold text-white">Admin Login</h2>
				<p class="mb-4 text-center text-sm text-gray-400">
					Enter the admin password to manage configuration.
				</p>
				<input
					type="password"
					bind:value={passwordInput}
					onkeydown={handlePasswordKey}
					class="input mb-4 w-full"
					placeholder="Password"
				/>
				<button class="btn btn-primary w-full" onclick={login}>Login</button>
			</div>
		</div>
	{:else}
		<!-- Admin Panel -->
		<div class="mb-6 flex items-center justify-between">
			<h1 class="font-Mohave text-3xl font-bold text-white">Admin Panel</h1>
			<div class="flex gap-2">
				<button
					class="btn btn-primary text-sm"
					onclick={saveConfig}
					disabled={saving}
				>
					{saving ? 'Saving...' : 'Save to Server'}
				</button>
				<button class="btn btn-secondary text-sm" onclick={exportConfig}>Export</button>
				<button class="btn btn-secondary text-sm" onclick={() => (showImportModal = true)}>Import</button>
				<button class="btn btn-outline text-sm" onclick={logout}>Logout</button>
			</div>
		</div>

		<!-- Tabs -->
		<div class="mb-6 flex gap-1 border-b border-gray-700">
			{#each editors as editor}
				<button
					class="px-4 py-2 text-sm transition-colors {activeEditor === editor.key
						? 'border-b-2 border-primary-400 text-white'
						: 'text-gray-400 hover:text-gray-200'}"
					onclick={() => (activeEditor = editor.key)}
				>
					{editor.label}
				</button>
			{/each}
		</div>

		<!-- Alert Types Editor -->
		{#if activeEditor === 'alertTypes'}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-200">Alert Types</h2>
					<button class="btn-sm btn-outline" onclick={() => resetSection('alertTypes')}>Reset to Defaults</button>
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

		<!-- Ships Editor -->
		{#if activeEditor === 'ships'}
			<div class="space-y-6">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-200">Ships</h2>
					<button class="btn-sm btn-outline" onclick={() => resetSection('ships')}>Reset to Defaults</button>
				</div>

				{#each ['medical', 'combat', 'cap'] as category}
					<div>
						<h3 class="mb-2 text-sm font-semibold uppercase text-gray-400">{category} Ships</h3>
						<div class="rounded-lg border border-gray-700 bg-gray-800/50">
							{#each config.ships[category] || [] as ship, i}
								<div class="flex items-center justify-between border-b border-gray-700/50 px-4 py-2 last:border-b-0">
									<span class="text-sm text-gray-200">{ship.name}</span>
									<button class="text-xs text-red-400 hover:text-red-300" onclick={() => removeShip(category, i)}>Remove</button>
								</div>
							{/each}
							{#if !config.ships[category]?.length}
								<div class="px-4 py-2 text-sm text-gray-500 italic">No ships</div>
							{/if}
						</div>
					</div>
				{/each}

				<div class="flex gap-2">
					<select bind:value={editingShip.category} class="select w-32">
						<option value="medical">Medical</option>
						<option value="combat">Combat</option>
						<option value="cap">CAP</option>
					</select>
					<input type="text" bind:value={editingShip.name} class="input flex-1" placeholder="Ship name..." />
					<button class="btn btn-primary text-sm" onclick={addShip}>Add</button>
				</div>
			</div>
		{/if}

		<!-- Locations Editor -->
		{#if activeEditor === 'locations'}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-200">Locations ({config.locations.length})</h2>
					<button class="btn-sm btn-outline" onclick={() => resetSection('locations')}>Reset to Defaults</button>
				</div>
				<div class="max-h-96 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800/50">
					{#each config.locations as loc, i}
						<div class="flex items-center justify-between border-b border-gray-700/50 px-4 py-2 last:border-b-0">
							<div>
								<span class="text-sm text-gray-200">{loc.name}</span>
								<span class="ml-2 text-xs text-gray-500">{loc.type}</span>
							</div>
							<button class="text-xs text-red-400 hover:text-red-300" onclick={() => removeLocation(i)}>Remove</button>
						</div>
					{/each}
				</div>
				<div class="flex gap-2">
					<input type="text" bind:value={editingLocation.name} class="input flex-1" placeholder="Location name..." />
					<input type="text" bind:value={editingLocation.type} class="input w-40" placeholder="Type..." />
					<button class="btn btn-primary text-sm" onclick={addLocation}>Add</button>
				</div>
			</div>
		{/if}

		<!-- Templates Editor -->
		{#if activeEditor === 'templates'}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-200">Templates</h2>
					<button class="btn-sm btn-outline" onclick={() => resetSection('templates')}>Reset to Defaults</button>
				</div>
				{#each Object.entries(config.templates) as [key, tmpl]}
					<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
						<div class="mb-2 flex items-center justify-between">
							<div>
								<span class="text-lg">{tmpl.icon}</span>
								<span class="ml-2 font-semibold text-gray-200">{tmpl.name}</span>
							</div>
							<span class="text-xs text-gray-500">{key}</span>
						</div>
						<p class="mb-2 text-sm text-gray-400">{tmpl.description}</p>
						<div class="flex flex-wrap gap-1">
							{#each tmpl.sections as section}
								<span class="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">{section.name}</span>
							{/each}
							{#if tmpl.sections.length === 0}
								<span class="text-xs text-gray-500 italic">No sections</span>
							{/if}
						</div>
					</div>
				{/each}
				<p class="text-xs text-gray-500">
					To edit templates, export the config, modify the JSON, and re-import it.
				</p>
			</div>
		{/if}
	{/if}
</div>

<!-- Import Modal -->
{#if showImportModal}
	<Modal title="Import Configuration" onclose={() => (showImportModal = false)} size="lg">
		<div class="space-y-4">
			<p class="text-sm text-gray-400">
				Paste the JSON configuration below. This will override your current settings.
			</p>
			<textarea bind:value={importJson} class="textarea w-full font-mono text-sm" rows="12" placeholder="Paste JSON here..."></textarea>
			<div class="flex justify-end gap-2">
				<button class="btn btn-secondary" onclick={() => (showImportModal = false)}>Cancel</button>
				<button class="btn btn-primary" onclick={doImport}>Import</button>
			</div>
		</div>
	</Modal>
{/if}
