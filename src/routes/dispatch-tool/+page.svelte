<script>
	import '$lib/dispatch-tool/style.css';
	import { dropdownStatuses, getStatus, getStatusList } from '$lib/dispatch-tool/status.ts';
	import {
		dropdownSystems,
		getAllSystems,
		getSelectedSystem,
		setSelectedSystem,
		mapUnitToSystem
	} from '$lib/dispatch-tool/systems.ts';
	import { loadTeams, rerenderTeams, saveTeams } from '$lib/dispatch-tool/teams.ts';
	import { generateFeed } from '$lib/dispatch-tool/formatting.ts';
	import { successToast, errorToast } from '$lib/state/toast.svelte.js';
	import { supabase } from '$lib/supabaseClient.js';
	import Modal from '$lib/components/Modal.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import { MEDRUNNER_ROLES } from '$lib/data/roles.js';

	let TEAMS = $state(loadTeams());
	let clearModal = $state(false);
	let selectedSystem = $state(getSelectedSystem());

	// Copy pastes state
	let copyPastes = $state([]);
	let copyPastesLoaded = $state(false);
	let showCopyPaste = $state(true);
	let copyPasteWidth = $state(
		typeof window !== 'undefined'
			? parseInt(localStorage.getItem('medtools:dispatchCopyPasteWidth') || '280', 10)
			: 280
	);
	let isResizingCopyPaste = $state(false);
	let mobileCopyPaste = $state(false);

	// Import state
	let importLoading = $state(false);
	let updateLoading = $state(false);
	let showImportModal = $state(false);
	let showImportWarning = $state(false);
	let importTeams = $state([]);
	let selectedTeamIds = $state(new Set());
	let importedTeamIds = $state(
		typeof window !== 'undefined'
			? JSON.parse(localStorage.getItem('medtools:dispatchImportedTeamIds') || '[]')
			: []
	);

	const systems = dropdownSystems();
	const statuses = dropdownStatuses();

	let groupedImportTeams = $derived(
		Object.groupBy(importTeams, t => mapUnitToSystem(t.unit))
	);

	// Load dispatch copy pastes (by category containing "dispatch")
	async function loadDispatchPastes() {
		const { data } = await supabase
			.from('copypastes')
			.select('*')
			.ilike('category', '%dispatch%')
			.order('sort_order', { ascending: true });
		if (data) copyPastes = data;
		copyPastesLoaded = true;
	}

	if (typeof window !== 'undefined') loadDispatchPastes();

	function copyPaste(text) {
		navigator.clipboard.writeText(text).then(() => successToast('Copied!'));
	}

	// --- Import / Update active teams ---

	/** Map API team status codes to dispatch statuses */
	function mapApiStatus(apiStatus) {
		// MedRunner API team status: 1=Standby, 2=Mustering, 3=Alert, 4=Active/Available, 5=RTB, 6=Refitting
		switch (apiStatus) {
			case 1: return 'Mustering';
			case 2: return 'Mustering';
			case 3: return 'Alert';
			case 4: return 'Available';
			case 5: return 'RTB';
			case 6: return 'Refitting';
			default: return 'Available';
		}
	}

	/** Find team lead (class 4) from members, fallback to first member */
	function findTeamLead(members) {
		const lead = members.find(m => m.class === 4);
		return lead?.rsiHandle || members[0]?.rsiHandle || '';
	}

	/** Get role breakdown string for a team's members */
	function getMemberBreakdown(members) {
		const roleCounts = {};
		for (const m of members) {
			const role = MEDRUNNER_ROLES[m.class]?.abbreviation || '???';
			roleCounts[role] = (roleCounts[role] || 0) + 1;
		}
		return Object.entries(roleCounts).map(([r, c]) => `${c} ${r}`).join(', ');
	}

	async function fetchActiveTeams() {
		importLoading = true;
		importTeams = [];
		selectedTeamIds = new Set();
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
			// Pre-select all teams
			selectedTeamIds = new Set(teams.map(t => t.id));
			showImportModal = true;
		} catch (e) {
			errorToast(e.message || 'Failed to fetch teams');
		}
		importLoading = false;
	}

	function handleImportClick() {
		if (TEAMS.length > 0) {
			showImportWarning = true;
		} else {
			fetchActiveTeams();
		}
	}

	function importSelectedTeams() {
		const newTeams = [];
		for (const apiTeam of importTeams) {
			if (!selectedTeamIds.has(apiTeam.id)) continue;

			const teamNum = apiTeam.teamId || newTeams.length + 1;
			const leader = findTeamLead(apiTeam.members || []);
			const status = mapApiStatus(apiTeam.status);
			const system = mapUnitToSystem(apiTeam.unit);

			newTeams.push({
				position: newTeams.length + 1,
				num: teamNum,
				leader,
				status,
				comment: '',
				apiTeamId: apiTeam.id,
				members: (apiTeam.members || []).map(m => ({
					rsiHandle: m.rsiHandle,
					discordId: m.discordId,
					class: m.class
				})),
				memberCount: (apiTeam.members || []).length,
				unit: apiTeam.unit || '',
				system
			});
		}

		TEAMS = rerenderTeams(newTeams);
		importedTeamIds = newTeams.map(t => t.apiTeamId).filter(Boolean);
		localStorage.setItem('medtools:dispatchImportedTeamIds', JSON.stringify(importedTeamIds));
		showImportModal = false;
		successToast(`Imported ${newTeams.length} team${newTeams.length !== 1 ? 's' : ''}`);
	}

	async function updateActiveTeams() {
		updateLoading = true;
		try {
			const res = await fetch('/api/medrunner/teams');
			if (!res.ok) throw new Error('Failed to fetch teams');
			const json = await res.json();
			const apiTeams = json.data || [];

			let updated = 0;
			let added = 0;
			let removed = 0;

			const apiTeamMap = new Map(apiTeams.map(t => [t.id, t]));
			const existingApiIds = new Set(TEAMS.map(t => t.apiTeamId).filter(Boolean));

			// Update existing teams
			for (const team of TEAMS) {
				if (!team.apiTeamId) continue;
				const apiTeam = apiTeamMap.get(team.apiTeamId);
				if (apiTeam) {
					team.leader = findTeamLead(apiTeam.members || []);
					team.members = (apiTeam.members || []).map(m => ({
						rsiHandle: m.rsiHandle,
						discordId: m.discordId,
						class: m.class
					}));
					team.memberCount = (apiTeam.members || []).length;
					updated++;
				}
			}

			// Remove teams no longer active
			const beforeCount = TEAMS.length;
			TEAMS = TEAMS.filter(t => !t.apiTeamId || apiTeamMap.has(t.apiTeamId));
			removed = beforeCount - TEAMS.length;

			// Add new teams not yet tracked
			for (const apiTeam of apiTeams) {
				if (!existingApiIds.has(apiTeam.id)) {
					TEAMS.push({
						position: TEAMS.length + 1,
						num: apiTeam.teamId || TEAMS.length + 1,
						leader: findTeamLead(apiTeam.members || []),
						status: mapApiStatus(apiTeam.status),
						comment: '',
						apiTeamId: apiTeam.id,
						members: (apiTeam.members || []).map(m => ({
							rsiHandle: m.rsiHandle,
							discordId: m.discordId,
							class: m.class
						})),
						memberCount: (apiTeam.members || []).length,
						unit: apiTeam.unit || '',
						system: mapUnitToSystem(apiTeam.unit)
					});
					added++;
				}
			}

			TEAMS = rerenderTeams(TEAMS);
			importedTeamIds = TEAMS.map(t => t.apiTeamId).filter(Boolean);
			localStorage.setItem('medtools:dispatchImportedTeamIds', JSON.stringify(importedTeamIds));

			const parts = [];
			if (updated) parts.push(`${updated} updated`);
			if (added) parts.push(`${added} added`);
			if (removed) parts.push(`${removed} removed`);
			successToast(parts.length ? `Teams: ${parts.join(', ')}` : 'All teams up to date');
		} catch (e) {
			errorToast(e.message || 'Failed to update teams');
		}
		updateLoading = false;
	}

	function toggleTeamSelection(id) {
		const next = new Set(selectedTeamIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedTeamIds = next;
	}

	function startResizeCopyPaste(e) {
		isResizingCopyPaste = true;
		const startX = e.clientX;
		const startWidth = copyPasteWidth;
		function onMove(ev) {
			const delta = startX - ev.clientX;
			copyPasteWidth = Math.max(220, Math.min(500, startWidth + delta));
		}
		function onUp() {
			isResizingCopyPaste = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			localStorage.setItem('medtools:dispatchCopyPasteWidth', String(copyPasteWidth));
		}
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	function addTeam() {
		let newNum = 1;
		while (TEAMS.find((team) => team.num === newNum)) {
			newNum++;
		}

		if (newNum > 999) {
			errorToast('You cannot have more than 999 teams. Sorry :(');
			return;
		}

		let position = TEAMS.length + 1;
		TEAMS = [...TEAMS, { position, num: newNum, leader: '', status: 'Mustering', system: selectedSystem }];
		saveTeams(TEAMS);
	}

	function removeTeam(teamNum) {
		TEAMS = TEAMS.filter((team) => team.num !== teamNum);
		TEAMS = rerenderTeams(TEAMS);
	}

	function changeTeamNumber(teamNum, inputField) {
		let newNum = inputField.value;

		if (isNaN(newNum)) {
			errorToast('Error: The input was not a number');
			inputField.value = teamNum;
			return;
		}
		newNum = +newNum;
		if (TEAMS.find((team) => team.num === newNum)) {
			errorToast('You cannot have two teams with the same team number');
			inputField.value = teamNum;
			return;
		}
		if (newNum < 1 || newNum > 999) {
			errorToast('The team number must be between 1 and 999');
			inputField.value = teamNum;
			return;
		}

		inputField.value = newNum;
		let team = TEAMS.find((team) => team.num === teamNum);
		team.num = newNum;

		let component = document.querySelector(`[data-team="${teamNum}"]`);
		if (component) component.setAttribute('data-team', `${newNum}`);

		saveTeams(TEAMS);
		let teamSys = TEAMS.find((t) => t.num === newNum)?.system || selectedSystem;
		successToast(`Changed ${teamSys} ${teamNum} to ${teamSys} ${newNum}`);
	}

	function copyFeed() {
		if (TEAMS.length === 0) {
			errorToast('You need to have at least one team to copy the feed');
			return;
		}
		try {
			navigator.clipboard.writeText(generateFeed(selectedSystem, TEAMS));
			successToast('Feed copied');
		} catch (error) {
			errorToast('Error copying feed, please try again');
			console.error(error);
		}
	}

	let dragStartIndex = $state(0);

	function handleDragStart(e) {
		dragStartIndex = +e.currentTarget.getAttribute('data-index');
		e.currentTarget.classList.add('opacity-50');
	}

	function handleDragOver(e) {
		e.preventDefault();
		e.currentTarget.classList.add('border-white');
	}

	function handleDragEnter(e) {
		e.currentTarget.classList.add('border-white');
	}

	function handleDragLeave(e) {
		e.currentTarget.classList.remove('border-white');
	}

	function handleDrop(e) {
		const dragEndIndex = +e.currentTarget.getAttribute('data-index');
		swapComponents(dragStartIndex, dragEndIndex);
		e.currentTarget.classList.remove('border-white');
	}

	function handleDragEnd(e) {
		e.currentTarget.classList.remove('border-white', 'opacity-50');
	}

	function moveToFirst(teamNum) {
		TEAMS.forEach((team) => {
			if (team.num === teamNum) {
				team.position = 1;
			} else if (team.position < TEAMS.find((t) => t.num === teamNum).position) {
				team.position++;
			}
		});
		TEAMS = rerenderTeams(TEAMS);
	}

	function moveToLast(teamNum) {
		TEAMS.find((team) => team.num === teamNum).position = TEAMS.length + 1;
		TEAMS = rerenderTeams(TEAMS);
	}

	function swapComponents(startIndex, endIndex) {
		let temp = TEAMS[startIndex - 1];
		TEAMS[startIndex - 1] = TEAMS[endIndex - 1];
		TEAMS[endIndex - 1] = temp;
		TEAMS[startIndex - 1].position = startIndex;
		TEAMS[endIndex - 1].position = endIndex;
		TEAMS = rerenderTeams(TEAMS);
	}

	function updateTeamAttribute(teamNum, field, inputField) {
		let team = TEAMS.find((team) => team.num === teamNum);
		team[field] = inputField.value;
		TEAMS = rerenderTeams(TEAMS);
	}

	function clearAllTeams() {
		TEAMS = rerenderTeams([]);
		importedTeamIds = [];
		localStorage.removeItem('medtools:dispatchImportedTeamIds');
		clearModal = false;
	}
</script>

<svelte:head>
	<title>Dispatch Tool - Med-Tools</title>
	<meta property="og:title" content="Dispatch Tool - Med-Tools" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://med-tools.space/dispatch-tool" />
	<meta property="og:description" content="Real-time dispatch management for Medrunner teams. Track team status, assign systems, and coordinate operations." />
	<meta name="twitter:title" content="Dispatch Tool - Med-Tools" />
	<meta name="twitter:description" content="Real-time dispatch management for Medrunner teams." />
</svelte:head>

{#if clearModal}
<Modal onclose={() => (clearModal = false)} size="sm">
	<div class="text-center">
		<svg class="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
		</svg>
		<h3 class="mb-5 text-lg font-normal text-gray-400">
			Are you sure you want to clear <b>all</b> teams?
		</h3>
		<div class="flex justify-center gap-3">
			<button class="btn btn-danger" onclick={clearAllTeams}>Yes, I'm sure</button>
			<button class="btn btn-secondary" onclick={() => (clearModal = false)}>No, cancel</button>
		</div>
	</div>
</Modal>
{/if}

{#if showImportWarning}
<Modal onclose={() => (showImportWarning = false)} size="sm">
	<div class="text-center">
		<svg class="mx-auto mb-4 h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
		</svg>
		<h3 class="mb-4 text-lg font-normal text-gray-400">
			Importing will <b>replace</b> all existing teams. Continue?
		</h3>
		<div class="flex justify-center gap-3">
			<button class="btn bg-indigo-600 text-white hover:bg-indigo-700" onclick={() => { showImportWarning = false; fetchActiveTeams(); }}>
				Yes, import
			</button>
			<button class="btn btn-secondary" onclick={() => (showImportWarning = false)}>Cancel</button>
		</div>
	</div>
</Modal>
{/if}

{#if showImportModal}
<Modal onclose={() => (showImportModal = false)} size="lg">
	<h2 class="mb-4 text-lg font-semibold text-white">Import Active Teams</h2>
	{#if importTeams.length === 0}
		<p class="text-gray-400">No active teams found.</p>
	{:else}
		<p class="mb-3 text-sm text-gray-400">Select teams to import. Team lead is auto-detected.</p>
		<div class="max-h-[60vh] space-y-2 overflow-y-auto">
			{#each Object.entries(groupedImportTeams) as [systemName, sysTeams]}
				<div class="mb-2">
					<h3 class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">{systemName}</h3>
					{#each sysTeams as apiTeam}
				{@const lead = findTeamLead(apiTeam.members || [])}
				{@const isSelected = selectedTeamIds.has(apiTeam.id)}
				<button
					class="w-full rounded-lg border p-3 text-left transition-colors {isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}"
					onclick={() => toggleTeamSelection(apiTeam.id)}
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="flex h-5 w-5 items-center justify-center rounded border {isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'}">
								{#if isSelected}
									<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{/if}
							</div>
							<div>
								<span class="font-semibold text-white">{apiTeam.teamName || `Team ${apiTeam.teamId}`}</span>
								{#if apiTeam.unit}
									<span class="ml-2 rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400">{apiTeam.unit}</span>
								{/if}
							</div>
						</div>
						<span class="text-xs text-gray-500">{(apiTeam.members || []).length} members</span>
					</div>
					<div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
						<span>Lead: <span class="text-indigo-400">{lead || 'None'}</span></span>
						<span class="text-gray-600">|</span>
						<span>{getMemberBreakdown(apiTeam.members || [])}</span>
					</div>
					<div class="mt-1.5 flex flex-wrap gap-1">
						{#each (apiTeam.members || []) as m}
							<span class="inline-flex items-center gap-0.5 rounded bg-gray-700/50 px-1.5 py-0.5 text-[10px]">
								<span class="font-medium {m.class === 4 ? 'text-indigo-400' : 'text-gray-500'}">{MEDRUNNER_ROLES[m.class]?.abbreviation || '???'}</span>
								<span class="text-gray-300">{m.rsiHandle}</span>
							</span>
						{/each}
					</div>
				</button>
			{/each}
				</div>
			{/each}
		</div>
		<div class="mt-4 flex items-center justify-between">
			<span class="text-xs text-gray-500">{selectedTeamIds.size} of {importTeams.length} selected</span>
			<div class="flex gap-2">
				<button class="btn btn-secondary text-sm" onclick={() => (showImportModal = false)}>Cancel</button>
				<button
					class="btn bg-indigo-600 text-sm text-white hover:bg-indigo-700"
					onclick={importSelectedTeams}
					disabled={selectedTeamIds.size === 0}
				>Import {selectedTeamIds.size} Team{selectedTeamIds.size !== 1 ? 's' : ''}</button>
			</div>
		</div>
	{/if}
</Modal>
{/if}

<div class="flex min-h-0 flex-1 overflow-hidden">
<!-- Main dispatch content -->
<div class="flex-1 overflow-y-auto">
	<div class="relative flex justify-center gap-4 pb-20 lg:pb-12">
		<div class="my-4 flex w-full flex-col items-center gap-3">
			<div class="w-full max-w-3xl px-4">
				<!-- Default system selector -->
				<div class="mb-4 flex items-center gap-2">
					<label class="whitespace-nowrap text-sm text-gray-400">Default system:</label>
					<select class="select flex-1" bind:value={selectedSystem} onchange={() => setSelectedSystem(selectedSystem)}>
						{#each systems as sys}
							<option value={sys.value}>{sys.name}</option>
						{/each}
					</select>
				</div>

				{#if TEAMS.length === 0}
					<div class="py-12 text-center text-gray-500">
						<svg class="mx-auto mb-3 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<p class="text-lg">No teams yet</p>
						<p class="text-sm">Add a team or import from the API using the toolbar</p>
					</div>
				{:else}
					<div class="flex flex-col gap-4" id="draggable-wrapper">
						{#each TEAMS as team, i}
							<div
								class="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4 transition-colors hover:cursor-move hover:border-gray-600"
								role="group"
								draggable="true"
								data-index={team.position}
								data-team={team.num}
								ondragstart={handleDragStart}
								ondragover={handleDragOver}
								ondragenter={handleDragEnter}
								ondragleave={handleDragLeave}
								ondrop={handleDrop}
								ondragend={handleDragEnd}
							>
								<div class="mb-3 flex items-center gap-2">
									<select
										class="select inline w-auto text-sm text-white"
										value={team.system || selectedSystem}
										onchange={(e) => { TEAMS[team.position - 1].system = e.target.value; TEAMS = rerenderTeams(TEAMS); }}
									>
										{#each systems as sys}
											<option value={sys.value}>{sys.name}</option>
										{/each}
									</select>
									<input
										type="number"
										min="1"
										max="999"
										class="input w-16 text-sm"
										value={team.num}
										onchange={(e) => changeTeamNumber(team.num, e.target)}
									/>
									<div class="flex-1"></div>
									<div class="flex items-center gap-1">
										<button class="btn btn-outline btn-sm" onclick={() => moveToFirst(team.num)} title="Move to first">
											<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
												<path d="M18.41 16.59 13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41zM6 6h2v12H6V6z" />
											</svg>
										</button>
										<button class="btn btn-outline btn-sm" onclick={() => moveToLast(team.num)} title="Move to last">
											<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
												<path d="M5.59 7.41 10.18 12l-4.59 4.59L7 18l6-6-6-6-1.41 1.41zM16 6h2v12h-2V6z" />
											</svg>
										</button>
										<button
											class="btn btn-sm bg-red-700/80 text-white hover:bg-red-800"
											onclick={() => removeTeam(team.num)}
											title="Delete team"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
											</svg>
										</button>
									</div>
								</div>

								<div class="grid grid-cols-3 gap-2">
									<div class="col-span-2">
										<label for="team-name-{team.num}" class="mb-1 block text-xs text-gray-400">Team Lead</label>
										<input
											id="team-name-{team.num}"
											class="input block w-full text-sm"
											value={team.leader}
											placeholder="Enter Team Lead Name"
											oninput={(e) => updateTeamAttribute(team.num, 'leader', e.target)}
										/>
									</div>
									<div class="col-span-1">
										<label for="team-status-{team.num}" class="mb-1 block text-xs text-gray-400">Status</label>
										<select
											id="team-status-{team.num}"
											class="select block w-full text-sm"
											bind:value={TEAMS[team.position - 1].status}
											oninput={(e) => updateTeamAttribute(team.num, 'status', e.target)}
										>
											{#each statuses as status}
												<option value={status.value}>{status.name}</option>
											{/each}
										</select>
									</div>
								</div>

								{#if getStatus(team.status)?.input !== undefined}
									<div class="mt-2">
										<input
											id="team-comment-{team.num}"
											class="input block w-full text-sm"
											value={team.comment || ''}
											placeholder={getStatus(team.status)?.input}
											oninput={(e) => updateTeamAttribute(team.num, 'comment', e.target)}
										/>
									</div>
								{/if}

								{#if team.members?.length}
									<div class="mt-2 rounded-lg bg-gray-900/60 px-3 py-2">
										<div class="flex items-center gap-2 text-xs text-gray-400">
											<svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
											<span class="font-semibold text-gray-300">{team.members.length} members</span>
										</div>
										<div class="mt-1 flex flex-wrap gap-1.5">
											{#each team.members as m}
												<span class="inline-flex items-center gap-0.5 rounded bg-gray-700/60 px-1.5 py-0.5 text-[10px]">
													<span class="font-medium text-gray-400">{MEDRUNNER_ROLES[m.class]?.abbreviation || '???'}</span>
													<span class="text-gray-300">{m.rsiHandle}</span>
												</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Sticky action card — desktop only -->
		<div class="sticky top-4 mt-4 mr-6 hidden h-fit flex-col gap-2 rounded-xl border border-gray-700/50 bg-gray-800/95 p-3 shadow-2xl backdrop-blur-sm lg:flex">
			<button
				class="btn flex items-center justify-center gap-1.5 bg-lime-700 text-sm text-white hover:bg-lime-800"
				onclick={addTeam}
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path d="M5 12h14m-7 7V5" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
				</svg>
				New Team
			</button>
			<button class="btn btn-primary text-sm" onclick={copyFeed}>
				<svg class="mr-1 inline h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M15 1H4c-1.1 0-2 .9-2 2v13c0 .55.45 1 1 1s1-.45 1-1V4c0-.55.45-1 1-1h10c.55 0 1-.45 1-1s-.45-1-1-1zm.59 4.59 4.83 4.83c.37.37.58.88.58 1.41V21c0 1.1-.9 2-2 2H7.99C6.89 23 6 22.1 6 21l.01-14c0-1.1.89-2 1.99-2h6.17c.53 0 1.04.21 1.42.59zM15 12h4.5L14 6.5V11c0 .55.45 1 1 1z" />
				</svg>
				Copy Feed
			</button>
			<div class="h-px w-full bg-gray-600"></div>
			<button
				class="btn flex items-center justify-center gap-1.5 bg-indigo-600 text-sm text-white hover:bg-indigo-700"
				onclick={handleImportClick}
				disabled={importLoading}
			>
				{#if importLoading}
					<LoadingSpinner size="xs" />
				{:else}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
				{/if}
				Import
			</button>
			<button
				class="btn flex items-center justify-center gap-1.5 bg-cyan-700 text-sm text-white hover:bg-cyan-800"
				onclick={updateActiveTeams}
				disabled={updateLoading || importedTeamIds.length === 0}
				title={importedTeamIds.length === 0 ? 'Import teams first' : 'Update imported teams from API'}
			>
				{#if updateLoading}
					<LoadingSpinner size="xs" />
				{:else}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				{/if}
				Update
			</button>
			<div class="h-px w-full bg-gray-600"></div>
			<button
				class="btn flex items-center justify-center gap-1.5 bg-red-700 text-sm text-white hover:bg-red-800"
				onclick={() => (clearModal = true)}
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
				</svg>
				Delete All
			</button>
		</div>
	</div>
</div>

<!-- Copy-paste sidebar — desktop -->
{#if showCopyPaste}
	<div class="relative hidden flex-shrink-0 border-l border-gray-700 bg-gray-900 lg:flex" style="width: {copyPasteWidth}px">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-primary-400/30 {isResizingCopyPaste ? 'bg-primary-400/40' : ''}"
			onmousedown={startResizeCopyPaste}
		></div>
		<div class="flex h-full flex-1 flex-col overflow-hidden">
			<div class="flex items-center justify-between border-b border-gray-700 px-3 py-2">
				<h3 class="font-Mohave text-sm font-semibold uppercase tracking-wider text-gray-300">
					Dispatch Pastes
				</h3>
			</div>
			<div class="flex-1 overflow-y-auto p-2">
				{#if !copyPastesLoaded}
					<LoadingSpinner message="Loading..." size="sm" />
				{:else if copyPastes.length === 0}
					<p class="p-2 text-xs text-gray-500">No copy pastes found. Add pastes with a category containing "dispatch" to see them here.</p>
				{:else}
					{@const categories = [...new Set(copyPastes.map(p => p.category))]}
					{#each categories as category}
						<div class="mb-3">
							<p class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">{category}</p>
							{#each copyPastes.filter(p => p.category === category) as paste}
								<div class="mb-1 flex items-center gap-1 rounded bg-gray-700/40 px-2 py-1.5">
									<span class="min-w-0 flex-1 truncate text-xs text-gray-200" title={paste.content_normal}>{paste.name}</span>
									<button
										class="btn-sm btn-primary flex-shrink-0 text-[10px]"
										onclick={() => copyPaste(paste.content_normal)}
									>Copy</button>
								</div>
							{/each}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
</div>

<!-- Mobile bottom toolbar -->
<div class="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-gray-700 bg-gray-800/95 px-2 py-2 backdrop-blur-sm lg:hidden">
	<button class="btn flex items-center gap-1 bg-lime-700 px-3 py-1.5 text-xs text-white hover:bg-lime-800" onclick={addTeam}>
		<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path d="M5 12h14m-7 7V5" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
		</svg>
		Team
	</button>
	<button class="btn btn-primary px-3 py-1.5 text-xs" onclick={copyFeed}>Copy Feed</button>
	<button class="btn bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700" onclick={handleImportClick} disabled={importLoading}>Import</button>
	<button class="btn btn-outline px-3 py-1.5 text-xs" onclick={() => (mobileCopyPaste = true)}>
		Pastes
	</button>
</div>

<!-- Mobile slide-over panel -->
{#if mobileCopyPaste}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
		onclick={() => (mobileCopyPaste = false)}
		onkeydown={() => {}}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-gray-900 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
		>
			<div class="flex items-center justify-between border-b border-gray-700 px-4 py-3">
				<h3 class="font-Mohave text-lg font-semibold text-white">Dispatch Pastes</h3>
				<button
					class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
					onclick={() => (mobileCopyPaste = false)}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="flex-1 overflow-y-auto p-3">
				{#if !copyPastesLoaded}
					<LoadingSpinner message="Loading..." size="sm" />
				{:else if copyPastes.length === 0}
					<p class="text-sm text-gray-500">No dispatch copy pastes found.</p>
				{:else}
					{#each copyPastes as paste}
						<div class="mb-2 flex items-center justify-between gap-2 rounded bg-gray-800/60 px-3 py-2">
							<span class="min-w-0 flex-1 truncate text-xs text-gray-200" title={paste.content_normal}>{paste.name}</span>
							<button
								class="btn-sm btn-primary flex-shrink-0 text-[10px]"
								onclick={() => copyPaste(paste.content_normal)}
							>Copy</button>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Toggle copy-paste button — desktop only -->
<button
	class="fixed bottom-4 right-4 z-50 hidden rounded-full bg-gray-700 p-2.5 shadow-lg transition-colors hover:bg-gray-600 lg:block"
	onclick={() => (showCopyPaste = !showCopyPaste)}
	title={showCopyPaste ? 'Hide Dispatch Pastes' : 'Show Dispatch Pastes'}
>
	<svg class="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
	</svg>
</button>
