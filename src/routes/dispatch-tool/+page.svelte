<script>
	import '$lib/dispatch-tool/style.css';
	import { dropdownStatuses, getStatus, getStatusList } from '$lib/dispatch-tool/status.ts';
	import {
		dropdownSystems,
		getAllSystems,
		getSelectedSystem,
		setSelectedSystem
	} from '$lib/dispatch-tool/systems.ts';
	import { loadTeams, rerenderTeams, saveTeams } from '$lib/dispatch-tool/teams.ts';
	import { generateFeed } from '$lib/dispatch-tool/formatting.ts';
	import { successToast, errorToast } from '$lib/state/toast.svelte.js';
	import Modal from '$lib/components/Modal.svelte';

	let TEAMS = $state(loadTeams());
	let clearModal = $state(false);
	let selectedSystem = $state(getSelectedSystem());

	const systems = dropdownSystems();
	const statuses = dropdownStatuses();

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
		TEAMS = [...TEAMS, { position, num: newNum, leader: '', status: 'Mustering' }];
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
		successToast(`Changed ${selectedSystem} ${teamNum} to ${selectedSystem} ${newNum}`);
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
		clearModal = false;
	}
</script>

<svelte:head>
	<title>Dispatch Tool</title>
	<meta property="og:title" content="Dispatch Tool - Med-Tools" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://med-tools.space" />
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

<div class="max-w-8xl m-auto w-full justify-center sm:p-4 md:w-[70rem]">
	<div class="my-2 grid w-full grid-cols-3 items-center gap-4 px-5">
		<button
			class="btn flex items-center justify-center gap-2 bg-lime-700 text-white hover:bg-lime-900"
			onclick={addTeam}
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path d="M5 12h14m-7 7V5" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
			</svg>
			New Team
		</button>
		<button class="btn btn-primary flex items-center justify-center gap-2" onclick={copyFeed}>
			<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
				<path d="M15 1H4c-1.1 0-2 .9-2 2v13c0 .55.45 1 1 1s1-.45 1-1V4c0-.55.45-1 1-1h10c.55 0 1-.45 1-1s-.45-1-1-1zm.59 4.59 4.83 4.83c.37.37.58.88.58 1.41V21c0 1.1-.9 2-2 2H7.99C6.89 23 6 22.1 6 21l.01-14c0-1.1.89-2 1.99-2h6.17c.53 0 1.04.21 1.42.59zM15 12h4.5L14 6.5V11c0 .55.45 1 1 1z" />
			</svg>
			Copy Feed
		</button>
		<button
			class="btn flex items-center justify-center gap-2 bg-red-700 text-white hover:bg-red-900"
			onclick={() => (clearModal = true)}
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
			</svg>
			Delete all teams
		</button>
	</div>
	<div class="my-2 grid w-full grid-cols-1 items-center px-5">
		<select class="select" bind:value={selectedSystem} onchange={() => setSelectedSystem(selectedSystem)}>
			{#each systems as sys}
				<option value={sys.value}>{sys.name}</option>
			{/each}
		</select>
	</div>
	<div
		class="my-2 grid w-full grid-cols-1 items-center gap-4 px-5 xl:grid-cols-2"
		id="draggable-wrapper"
	>
		{#each TEAMS as team, i}
			<div
				class="rounded-lg border border-gray-700 bg-gray-900 p-3 hover:cursor-move"
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
				<div class="mb-4 flex items-center">
					<h3 class="inline text-white">{selectedSystem}</h3>
					<input
						type="number"
						min="1"
						max="999"
						class="input mx-3 inline w-16"
						value={team.num}
						onchange={(e) => changeTeamNumber(team.num, e.target)}
					/>
				</div>

				<div class="grid grid-cols-3 gap-2 rounded-lg p-2">
					<div class="col-span-2">
						<label for="team-name-{team.num}" class="mb-1 block text-sm text-gray-400">Team Lead</label>
						<input
							id="team-name-{team.num}"
							class="input block w-full"
							value={team.leader}
							placeholder="Enter Team Lead Name"
							oninput={(e) => updateTeamAttribute(team.num, 'leader', e.target)}
						/>
					</div>
					<div class="col-span-1">
						<label for="team-status-{team.num}" class="mb-1 block text-sm text-gray-400">Team Status</label>
						<select
							id="team-status-{team.num}"
							class="select block w-full"
							bind:value={TEAMS[team.position - 1].status}
							oninput={(e) => updateTeamAttribute(team.num, 'status', e.target)}
						>
							{#each statuses as status}
								<option value={status.value}>{status.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="p-2">
					{#if getStatus(team.status)?.input !== undefined}
						<input
							id="team-comment-{team.num}"
							class="input block w-full"
							value={team.comment || ''}
							placeholder={getStatus(team.status)?.input}
							oninput={(e) => updateTeamAttribute(team.num, 'comment', e.target)}
						/>
					{:else}
						<div class="invisible h-10"></div>
					{/if}
				</div>

				<div class="flex justify-between p-1">
					<button class="btn btn-outline btn-sm flex items-center gap-1" onclick={() => moveToFirst(team.num)}>
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M18.41 16.59 13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41zM6 6h2v12H6V6z" />
						</svg>
						Move to first
					</button>
					<button class="btn btn-outline btn-sm flex items-center gap-1" onclick={() => moveToLast(team.num)}>
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M5.59 7.41 10.18 12l-4.59 4.59L7 18l6-6-6-6-1.41 1.41zM16 6h2v12h-2V6z" />
						</svg>
						Move to last
					</button>
					<button
						class="btn btn-sm flex items-center gap-1 bg-red-700 text-white hover:bg-red-900"
						onclick={() => removeTeam(team.num)}
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
						</svg>
						Delete
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>

<footer>
	<div class="mx-auto w-full max-w-screen-xl p-4 md:py-8">
		<hr class="my-6 border-gray-700 sm:mx-auto lg:my-8" />
		<span class="block text-sm text-gray-400 sm:text-center">
			It is known, that the ability to customize your own statuses is not yet included.
		</span>
		<span class="block text-sm text-gray-400 sm:text-center">
			Due to the refactor needed to implement the code into this website, it may take a while until the feature is added back in, depending on my workload.
		</span>
		<span class="block text-sm text-gray-400 sm:text-center">
			Until then, feel free to use the "standalone" version of the Dispatch Tool, if you want to use this feature.
		</span>
	</div>
</footer>
