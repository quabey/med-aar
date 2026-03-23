<script>
	import { assignmentPlayers, assignmentShips, pilotAssignments } from '$lib/stores.js';
	import { get } from 'svelte/store';
	import ships from '$lib/data/ships.json';
	import { MEDRUNNER_ROLES, getRoleLabel } from '$lib/data/roles.js';
	import { successToast, errorToast } from '$lib/state/toast.svelte.js';
	import Modal from '$lib/components/Modal.svelte';

	let newGunshipPlayer = $state('');
	let newMedshipPlayer = $state('');
	let newCAPPlayer = $state('');
	let collapsed = $state(false);

	// Import state
	let showImportModal = $state(false);
	let importLoading = $state(false);
	let importTeams = $state([]);
	let selectedTeamId = $state('');
	let importedTeamId = $state(
		typeof window !== 'undefined' ? localStorage.getItem('medtools:importedTeamId') || '' : ''
	);
	let updateLoading = $state(false);

	function getPlayerName(player) {
		return typeof player === 'string' ? player : player.name;
	}

	function getPlayerRole(player) {
		if (typeof player === 'string') return null;
		return player.role;
	}

	function createPlayer(name, discordId, role) {
		if (discordId || role != null) {
			return { name: name.trim(), discordId: discordId || '', role };
		}
		return { name: name.trim() };
	}

	function movePlayer(player, fromKey, toKey) {
		const players = get(assignmentPlayers);
		const pName = getPlayerName(player);
		const idx = players[fromKey].findIndex((p) => getPlayerName(p) === pName);
		if (idx === -1) return;
		const [moved] = players[fromKey].splice(idx, 1);
		players[toKey].push(moved);
		assignmentPlayers.update((v) => {
			v[fromKey] = [...players[fromKey]];
			v[toKey] = [...players[toKey]];
			return v;
		});
	}

	function addPlayer(key, name) {
		if (!name.trim()) return;
		assignmentPlayers.update((p) => {
			p[key] = [...p[key], createPlayer(name)];
			return p;
		});
	}

	function removePlayer(playerName) {
		assignmentPlayers.update((p) => {
			p.medship = p.medship.filter((x) => getPlayerName(x) !== playerName);
			p.gunship = p.gunship.filter((x) => getPlayerName(x) !== playerName);
			p.cap = p.cap.filter((x) => getPlayerName(x) !== playerName);
			return p;
		});
	}

	function handleKeydown(e, key, value) {
		if (e.key === 'Enter') {
			addPlayer(key, value);
			if (key === 'gunship') newGunshipPlayer = '';
			else if (key === 'medship') newMedshipPlayer = '';
			else if (key === 'cap') newCAPPlayer = '';
		}
	}

	function getPlayerMention(player) {
		if (typeof player !== 'string' && player.discordId) {
			return `<@${player.discordId}>`;
		}
		return getPlayerName(player);
	}

	function copyAssignments() {
		let message = '';
		if ($assignmentPlayers.gunship.length > 0) {
			message += `**__Gunship__** ${$assignmentShips.gunship ?? ''}${$pilotAssignments.gunship ? ' - *Pilot: ' + $pilotAssignments.gunship.trim() + '*' : ''}\n`;
			$assignmentPlayers.gunship.forEach((p) => (message += `> ${getPlayerMention(p)}\n`));
			message += '\n';
		}
		if ($assignmentPlayers.medship.length > 0) {
			message += `**__Medship__** *${$assignmentShips.medship ?? ''}${$pilotAssignments.medship ? ' - Pilot: ' + $pilotAssignments.medship.trim() : ''}*\n`;
			$assignmentPlayers.medship.forEach((p) => (message += `> ${getPlayerMention(p)}\n`));
			message += '\n';
		}
		if ($assignmentPlayers.cap.length > 0) {
			message += `**__CAP__** ${$assignmentShips.cap ?? ''}\n`;
			$assignmentPlayers.cap.forEach((p) => (message += `> ${getPlayerMention(p)}\n`));
			message += '\n';
		}
		navigator.clipboard.writeText(message);
		successToast('Assignments copied');
	}

	function clearAssignments() {
		assignmentPlayers.set({ gunship: [], medship: [], cap: [] });
		assignmentShips.set({ gunship: '', medship: '', cap: '' });
		pilotAssignments.set({ gunship: '', medship: '' });
		importedTeamId = '';
		localStorage.removeItem('medtools:importedTeamId');
	}

	// Medrunner import
	async function fetchActiveTeams() {
		importLoading = true;
		importTeams = [];
		selectedTeamId = '';
		try {
			const res = await fetch('/api/medrunner/teams');
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || 'Failed to fetch teams');
			}
			const json = await res.json();
			const teams = json.data || [];
			if (teams.length === 0) {
				errorToast('No active teams found');
				importLoading = false;
				return;
			}
			importTeams = teams;
			showImportModal = true;
		} catch (e) {
			errorToast(e.message || 'Failed to fetch teams');
		}
		importLoading = false;
	}

	function getPlayerJoinOrder(player) {
		if (typeof player === 'string') return null;
		return player.joinOrder ?? null;
	}

	function importSelectedTeam() {
		const team = importTeams.find((t) => t.id === selectedTeamId);
		if (!team) return;

		// Sort members by updated_at to determine join order
		const sorted = [...team.members].sort((a, b) => {
			const aTime = a.updated_at || a.updatedAt || 0;
			const bTime = b.updated_at || b.updatedAt || 0;
			return aTime - bTime;
		});

		// Build a join order map (1-based)
		const joinOrderMap = new Map();
		sorted.forEach((m, i) => joinOrderMap.set(m.id || m.discordId, i + 1));

		const gunship = [];
		const medship = [];
		const cap = [];

		// Group members by role
		const pilots = [];
		const teamLeads = [];
		const medics = [];
		const security = [];
		const capMembers = [];
		const others = [];

		for (const m of team.members) {
			const order = joinOrderMap.get(m.id || m.discordId);
			const player = { name: m.rsiHandle, discordId: m.discordId, role: m.class, joinOrder: order };
			switch (m.class) {
				case 3: pilots.push(player); break;
				case 4: teamLeads.push(player); break;
				case 1: medics.push(player); break;
				case 2: security.push(player); break;
				case 9: capMembers.push(player); break;
				default: others.push(player); break;
			}
		}

		// Pilots → gunship (first pilot set as pilot assignment)
		for (const p of pilots) {
			gunship.push(p);
		}
		if (pilots.length > 0) {
			pilotAssignments.update((pa) => {
				pa.gunship = pilots[0].name;
				return pa;
			});
		}

		// Team Leads → gunship
		for (const p of teamLeads) gunship.push(p);

		// Medics: 1st → medship, 2nd → gunship, 3rd → medship, etc.
		medics.forEach((p, i) => {
			if (i % 2 === 0) medship.push(p);
			else gunship.push(p);
		});

		// Security: 1st → gunship, 2nd → medship, 3rd → gunship, etc.
		security.forEach((p, i) => {
			if (i % 2 === 0) gunship.push(p);
			else medship.push(p);
		});

		// CAP → cap group
		for (const p of capMembers) cap.push(p);

		// Unknown roles → gunship
		for (const p of others) gunship.push(p);

		assignmentPlayers.update((p) => {
			p.gunship = [...p.gunship, ...gunship];
			p.medship = [...p.medship, ...medship];
			p.cap = [...p.cap, ...cap];
			return p;
		});

		showImportModal = false;
		importedTeamId = team.id;
		localStorage.setItem('medtools:importedTeamId', team.id);
		successToast(`Imported ${team.members.length} members from ${team.teamName}`);
	}

	function buildJoinOrderMap(members) {
		const sorted = [...members].sort((a, b) => {
			const aTime = a.updated_at || a.updatedAt || 0;
			const bTime = b.updated_at || b.updatedAt || 0;
			return aTime - bTime;
		});
		const map = new Map();
		sorted.forEach((m, i) => map.set(m.id || m.discordId, i + 1));
		return map;
	}

	function assignToGroup(player) {
		switch (player.role) {
			case 3: return 'gunship'; // pilot
			case 4: return 'gunship'; // team lead
			case 1: return 'medship'; // medic
			case 2: return 'gunship'; // security
			case 9: return 'cap'; // CAP
			default: return 'gunship';
		}
	}

	async function updateTeam() {
		if (!importedTeamId) return;
		updateLoading = true;
		try {
			const res = await fetch('/api/medrunner/teams');
			if (!res.ok) throw new Error('Failed to fetch teams');
			const json = await res.json();
			const teams = json.data || [];
			const team = teams.find((t) => t.id === importedTeamId);
			if (!team) {
				errorToast('Team no longer active');
				updateLoading = false;
				return;
			}

			const joinOrderMap = buildJoinOrderMap(team.members);
			const currentMembers = new Set(team.members.map((m) => m.discordId || m.id));

			// Build set of all existing player discordIds across groups
			const players = get(assignmentPlayers);
			const allGroups = ['gunship', 'medship', 'cap'];

			// Remove players who left the team
			for (const group of allGroups) {
				players[group] = players[group].filter((p) => {
					if (typeof p === 'string') return true; // manually added, keep
					if (!p.discordId) return true; // no discord id, keep
					return currentMembers.has(p.discordId);
				});
			}

			// Find existing discordIds after removal
			const existingIds = new Set();
			for (const group of allGroups) {
				for (const p of players[group]) {
					if (typeof p !== 'string' && p.discordId) existingIds.add(p.discordId);
				}
			}

			// Add new members and update join orders on existing
			let added = 0;
			let removed = 0;
			for (const m of team.members) {
				const memberId = m.discordId || m.id;
				const order = joinOrderMap.get(m.id || m.discordId);

				if (!existingIds.has(m.discordId)) {
					// New member — add to appropriate group
					const player = { name: m.rsiHandle, discordId: m.discordId, role: m.class, joinOrder: order };
					const group = assignToGroup(player);
					players[group].push(player);
					added++;
				} else {
					// Existing member — update join order
					for (const group of allGroups) {
						const idx = players[group].findIndex((p) => typeof p !== 'string' && p.discordId === m.discordId);
						if (idx !== -1) {
							players[group][idx] = { ...players[group][idx], joinOrder: order, role: m.class };
							break;
						}
					}
				}
			}

			assignmentPlayers.set({
				gunship: [...players.gunship],
				medship: [...players.medship],
				cap: [...players.cap]
			});

			successToast(`Team updated (+${added} joined)`);
		} catch (e) {
			errorToast(e.message || 'Failed to update team');
		}
		updateLoading = false;
	}

	export function getAssignmentShips() {
		return {
			gunship: get(assignmentShips).gunship || '',
			medship: get(assignmentShips).medship || '',
			cap: get(assignmentShips).cap || ''
		};
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b border-gray-700 px-3 py-2">
		<h3 class="font-Mohave text-sm font-semibold uppercase tracking-wider text-gray-300">
			Assignments
		</h3>
		<div class="flex items-center gap-1">
			{#if importedTeamId}
				<button
					class="btn-sm btn-primary text-xs"
					onclick={updateTeam}
					disabled={updateLoading}
					title="Re-fetch team and update members"
				>
					{updateLoading ? 'Updating...' : 'Update'}
				</button>
			{/if}
			<button
				class="btn-sm btn-primary text-xs"
				onclick={fetchActiveTeams}
				disabled={importLoading}
			>
				{importLoading ? 'Loading...' : 'Import'}
			</button>
			<button
				class="rounded p-1 text-gray-400 transition-colors hover:text-white"
				onclick={() => (collapsed = !collapsed)}
				title={collapsed ? 'Expand' : 'Collapse'}
			>
				<svg class="h-4 w-4 transition-transform {collapsed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
		</div>
	</div>

	{#if !collapsed}
		<div class="flex-1 space-y-3 overflow-y-auto p-3">
			<!-- Gunship -->
			<div class="rounded-lg border border-gray-700/50 bg-gray-800/50 p-2.5">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs font-bold uppercase text-gray-300">Gunship</span>
					{#if $pilotAssignments.gunship}
						<span class="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">
							✈ {$pilotAssignments.gunship}
						</span>
					{/if}
				</div>
				<select class="select mb-2 w-full text-xs" bind:value={$assignmentShips.gunship}>
					<option value="">Ship...</option>
					{#each ships.combat as ship}
						<option value={ship.value}>{ship.name}</option>
					{/each}
				</select>
				<div class="flex gap-1">
					<input
						type="text"
						class="input flex-1 text-xs"
						bind:value={newGunshipPlayer}
						placeholder="Player name"
						onkeydown={(e) => handleKeydown(e, 'gunship', newGunshipPlayer)}
					/>
					<button
						class="btn-sm btn-primary text-xs"
						onclick={() => { addPlayer('gunship', newGunshipPlayer); newGunshipPlayer = ''; }}
					>+</button>
				</div>
				{#each $assignmentPlayers.gunship as player}
					<div class="mt-1.5 flex items-center justify-between rounded bg-gray-700/40 px-2 py-1.5">
						<div class="flex items-center gap-1.5">
							{#if getPlayerRole(player) != null}
								<span class="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-300">{getRoleLabel(getPlayerRole(player))}</span>
							{/if}
							{#if getPlayerJoinOrder(player)}
								<span class="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-300" title="Join order #{getPlayerJoinOrder(player)}">#{getPlayerJoinOrder(player)}</span>
							{/if}
							<span class="text-xs text-gray-200">{getPlayerName(player)}</span>
						</div>
						<div class="flex gap-1">
							<button class="rounded bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-blue-600 hover:text-white" onclick={() => movePlayer(player, 'gunship', 'medship')} title="Move to Medship">Med</button>
							<button class="rounded bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-blue-600 hover:text-white" onclick={() => movePlayer(player, 'gunship', 'cap')} title="Move to CAP">CAP</button>
							<button class="rounded bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-amber-600 hover:text-white" onclick={() => ($pilotAssignments.gunship = getPlayerName(player))} title="Set Pilot">✈</button>
							<button class="rounded bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-red-600 hover:text-white" onclick={() => removePlayer(getPlayerName(player))} title="Remove">✕</button>
						</div>
					</div>
				{/each}
			</div>

			<!-- Medship -->
			<div class="rounded-lg border border-gray-700/50 bg-gray-800/50 p-2.5">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs font-bold uppercase text-gray-300">Medship</span>
					{#if $pilotAssignments.medship}
						<span class="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">
							✈ {$pilotAssignments.medship}
						</span>
					{/if}
				</div>
				<select class="select mb-2 w-full text-xs" bind:value={$assignmentShips.medship}>
					<option value="">Ship...</option>
					{#each ships.medical as ship}
						<option value={ship.value}>{ship.name}</option>
					{/each}
				</select>
				<div class="flex gap-1">
					<input
						type="text"
						class="input flex-1 text-xs"
						bind:value={newMedshipPlayer}
						placeholder="Player name"
						onkeydown={(e) => handleKeydown(e, 'medship', newMedshipPlayer)}
					/>
					<button
						class="btn-sm btn-primary text-xs"
						onclick={() => { addPlayer('medship', newMedshipPlayer); newMedshipPlayer = ''; }}
					>+</button>
				</div>
				{#each $assignmentPlayers.medship as player}
					<div class="mt-1.5 flex items-center justify-between rounded bg-gray-700/40 px-2 py-1.5">
						<div class="flex items-center gap-1.5">
							{#if getPlayerRole(player) != null}
								<span class="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-300">{getRoleLabel(getPlayerRole(player))}</span>
							{/if}
							{#if getPlayerJoinOrder(player)}
								<span class="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-300" title="Join order #{getPlayerJoinOrder(player)}">#{getPlayerJoinOrder(player)}</span>
							{/if}
							<span class="text-xs text-gray-200">{getPlayerName(player)}</span>
						</div>
						<div class="flex gap-1">
							<button class="rounded bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-blue-600 hover:text-white" onclick={() => movePlayer(player, 'medship', 'gunship')} title="Move to Gunship">Gun</button>
							<button class="rounded bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-blue-600 hover:text-white" onclick={() => movePlayer(player, 'medship', 'cap')} title="Move to CAP">CAP</button>
							<button class="rounded bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-amber-600 hover:text-white" onclick={() => ($pilotAssignments.medship = getPlayerName(player))} title="Set Pilot">✈</button>
							<button class="rounded bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-red-600 hover:text-white" onclick={() => removePlayer(getPlayerName(player))} title="Remove">✕</button>
						</div>
					</div>
				{/each}
			</div>

			

			<!-- CAP -->
			<div class="rounded-lg border border-gray-700/50 bg-gray-800/50 p-2.5">
				<span class="mb-2 block text-xs font-bold uppercase text-gray-300">CAP</span>
				<div class="flex gap-1">
					<input
						type="text"
						class="input flex-1 text-xs"
						bind:value={newCAPPlayer}
						placeholder="Player name"
						onkeydown={(e) => handleKeydown(e, 'cap', newCAPPlayer)}
					/>
					<button
						class="btn-sm btn-primary text-xs"
						onclick={() => { addPlayer('cap', newCAPPlayer); newCAPPlayer = ''; }}
					>+</button>
				</div>
				{#each $assignmentPlayers.cap as player}
					<div class="mt-1.5 flex items-center justify-between rounded bg-gray-700/40 px-2 py-1.5">
						<div class="flex items-center gap-1.5">
							{#if getPlayerRole(player) != null}
								<span class="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-300">{getRoleLabel(getPlayerRole(player))}</span>
							{/if}
							{#if getPlayerJoinOrder(player)}
								<span class="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-bold text-primary-300" title="Join order #{getPlayerJoinOrder(player)}">#{getPlayerJoinOrder(player)}</span>
							{/if}
							<span class="text-xs text-gray-200">{getPlayerName(player)}</span>
						</div>
						<div class="flex gap-1">
							<button class="rounded bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-blue-600 hover:text-white" onclick={() => movePlayer(player, 'cap', 'gunship')} title="Move to Gunship">Gun</button>
							<button class="rounded bg-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 transition-colors hover:bg-red-600 hover:text-white" onclick={() => removePlayer(getPlayerName(player))} title="Remove">✕</button>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Action buttons at the bottom -->
		<div class="flex gap-2 border-t border-gray-700 p-3">
			<button class="btn btn-primary flex-1 text-sm" onclick={copyAssignments}>Copy</button>
			<button class="btn btn-outline flex-1 text-sm" onclick={clearAssignments}>Clear</button>
		</div>
	{/if}
</div>

<!-- Import Team Modal -->
{#if showImportModal}
	<Modal title="Import Active Team" onclose={() => (showImportModal = false)} size="md">
		<div class="space-y-4">
			<p class="text-sm text-gray-400">Select a team to import. Members will be auto-assigned based on their role.</p>
			<div class="space-y-2">
				{#each importTeams as team}
					<button
						class="w-full rounded-lg border p-3 text-left transition-colors {selectedTeamId === team.id
							? 'border-primary-400 bg-primary-500/10'
							: 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}"
						onclick={() => (selectedTeamId = team.id)}
					>
						<div class="flex items-center justify-between">
							<span class="font-semibold text-gray-200">{team.teamName}</span>
							<span class="text-xs text-gray-400">{team.members.length} members</span>
						</div>
						<div class="mt-1 flex flex-wrap gap-1">
							{#each team.members as member}
								<span class="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300">
									{member.rsiHandle}
								</span>
							{/each}
						</div>
					</button>
				{/each}
			</div>
			<div class="flex justify-end gap-2">
				<button class="btn btn-secondary" onclick={() => (showImportModal = false)}>Cancel</button>
				<button class="btn btn-primary" onclick={importSelectedTeam} disabled={!selectedTeamId}>Import Team</button>
			</div>
		</div>
	</Modal>
{/if}
