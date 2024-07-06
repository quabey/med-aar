<script>
	import '$lib/dispatch-tool/style.css';
	import { getStatusList } from '$lib/dispatch-tool/status.ts';
	import { getAllSystems, getSelectedSystem, setSelectedSystem } from '$lib/dispatch-tool/systems.ts';
	import { loadTeams, rerenderTeams, saveTeams } from '$lib/dispatch-tool/teams.ts';
	import { generateFeed } from '$lib/dispatch-tool/formatting.ts';

	import { toast } from 'svelte-french-toast';

	// TODO: Add input field when an input field is specified in the status list
	// TODO: Add functionality to copy the feed
	// TODO: Add the settings menu back in
	// TODO SETTINGS: Add functionality to change elements per row
	// TODO SETTINGS: Add functionality to change the status list and their colors

	$: TEAMS = loadTeams();

	function addTeam() {
		let newNum = 1;
		while (TEAMS.find(team => team.num === newNum)) {
			newNum++;
		}

		if (newNum > 999) {
			toast.error('You cannot have more than 999 teams. Sorry :(', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
			return;
		}

		let position = TEAMS.length + 1;
		TEAMS = [...TEAMS, { position: position, num: newNum, leader: '', status: 'Mustering' }];
		saveTeams(TEAMS);
	}

	function removeTeam(teamNum) {
		TEAMS = TEAMS.filter(team => team.num !== teamNum);
		TEAMS = rerenderTeams(TEAMS);
	}

	function changeTeamNumber(teamNum, inputField) {
		let newNum = inputField.value;

		if (isNaN(newNum)) {
			toast.error('Error: The input was no numer', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
			inputField = teamNum;
			return;
		}
		newNum = +newNum;
		if (TEAMS.find(team => team.num === newNum)) {
			toast.error('You cannot have two teams with the same team number', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
			inputField.value = teamNum;
			return;
		}
		if (newNum < 1 || newNum > 999) {
			toast.error('The team number must be between 1 and 999', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
			inputField.value = teamNum;
			return;
		}

		inputField.value = newNum;
		let team = TEAMS.find(team => team.num === teamNum);
		team.num = newNum;

		let component = document.querySelector(`[data-team="${teamNum}"]`);
		component.setAttribute('data-team', `${newNum}`);

		saveTeams(TEAMS);

		toast.success('Changed ' + selectedSystem + ' ' + teamNum + ' to ' + selectedSystem + ' ' + newNum, {
			style: 'background-color: #2c5278; color: white;',
			position: 'top-right'
		});
	}

	let selectedSystem = getSelectedSystem();

	function copyFeed() {
		try {
			navigator.clipboard.writeText(generateFeed(selectedSystem, TEAMS));
			toast.success('Feed copied', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
		} catch (error) {
			toast.error('Error copying feed, try again', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
			console.error(error);
		}
	}

	let dragStartIndex;

	function dragStart() {
		dragStartIndex = +this.getAttribute('data-index');
		this.classList.add('dragging');
	}

	function dragOver(e) {
		e.preventDefault();
		this.classList.add('over');
	}

	function dragEnter() {
		this.classList.add('over');
	}

	function dragLeave() {
		this.classList.remove('over');
	}

	function dragDrop() {
		const dragEndIndex = +this.getAttribute('data-index');
		swapComponents(dragStartIndex, dragEndIndex);
		this.classList.remove('over');
	}

	function dragEnd() {
		this.classList.remove('over');
		this.classList.remove('dragging');
	}

	function moveToFirst(teamNum) {
		// Increment the position of all teams that are above the team that is being moved
		TEAMS.forEach(team => {
			if (team.num === teamNum) {
				team.position = 1;
			} else if (team.position < TEAMS.find(team => team.num === teamNum).position) {
				team.position++;
			}
		});
		TEAMS = rerenderTeams(TEAMS);
	}

	function moveToLast(teamNum) {
		// Set the position of the team that is being moved to the last position and let the rerender handle the correction of the positions
		TEAMS.find(team => team.num === teamNum).position = TEAMS.length + 1;
		TEAMS = rerenderTeams(TEAMS);
	}

	/**
	 * Swaps the components in the DOM
	 * While this happens, the function will move the corresponding team to the new position in the array
	 * @param startIndex The index of the component that is being dragged
	 * @param endIndex The index of the component that is being dropped on
	 */
	function swapComponents(startIndex, endIndex) {
		// Swap the two components in the DOM by changing their position in the array and letting Svelte rerender the positions
		// This has the added benefit of preserving event listeners on elements inside the component
		let temp = TEAMS[startIndex - 1];
		TEAMS[startIndex - 1] = TEAMS[endIndex - 1];
		TEAMS[endIndex - 1] = temp;
		TEAMS[startIndex - 1].position = startIndex;
		TEAMS[endIndex - 1].position = endIndex;
		TEAMS = rerenderTeams(TEAMS);
	}

	/**
	 * Updates the team object in the TEAMS array.
	 * Important: This function will not correctly change the number or the position of the team
	 * @param teamNum The number of the team that is being updated
	 * @param field The field that is being updated
	 * @param inputField The input field that is being updated
	 */
	function updateTeamAttribute(teamNum, field, inputField) {
		let team = TEAMS.find(team => team.num === teamNum);
		team[field] = inputField.value;
		saveTeams(TEAMS);
	}
</script>

<svelte:head>
	<title>Dispatch Tool</title>
</svelte:head>

<div class="justify-center pb-12">
	<div class="my-2 w-full items-center gap-4 grid grid-cols-2 px-5">
		<button class="btn btn-green" on:click={addTeam}>
			<svg aria-label="plus outline" class="shrink-0 ms-2 mr-2 h-6 w-6 text-white dark:text-white" color="currentColor"
					 fill="none" role="img" viewBox="0 0 24 24"
					 xmlns="http://www.w3.org/2000/svg">
				<path d="M5 12h14m-7 7V5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
							stroke-width="2"></path>
			</svg>
			New Team
		</button>
		<button class="btn" on:click={copyFeed}>
			<svg aria-label="copy filled" class="shrink-0 ms-2 mr-2 h-6 w-6 text-white dark:text-white"
					 color="currentColor" role="img" viewBox="0 0 24 24"
					 xmlns="http://www.w3.org/2000/svg"><title>file_copy</title>
				<g fill="#F7F7F7">
					<path
						d="M15 1H4c-1.1 0-2 .9-2 2v13c0 .55.45 1 1 1s1-.45 1-1V4c0-.55.45-1 1-1h10c.55 0 1-.45 1-1s-.45-1-1-1zm.59 4.59 4.83 4.83c.37.37.58.88.58 1.41V21c0 1.1-.9 2-2 2H7.99C6.89 23 6 22.1 6 21l.01-14c0-1.1.89-2 1.99-2h6.17c.53 0 1.04.21 1.42.59zM15 12h4.5L14 6.5V11c0 .55.45 1 1 1z"></path>
				</g>
			</svg>
			Copy
		</button>
	</div>
	<div class="my-2 w-full items-center grid grid-cols-1 px-5">
		<select id="system-selector" bind:value={selectedSystem} class="selector" on:change={() => setSelectedSystem(selectedSystem)}>
			{#each getAllSystems() as system}
				<option value={system}>{system}</option>
			{/each}
		</select>
	</div>
	<div class="my-2 w-full items-center gap-4 grid grid-cols-1 xl:grid-cols-2 px-5" id="draggable-wrapper">
		{#each TEAMS as team}
			<div class="draggable-component bg-gray-900 dark:bg-gray-900" aria-controls="team-name team-lead" role="group"
					 draggable="true"
					 data-index={team.position}
					 data-team={team.num}
					 on:dragstart={dragStart}
					 on:dragover={dragOver}
					 on:dragenter={dragEnter}
					 on:dragleave={dragLeave}
					 on:drop={dragDrop}
					 on:dragend={dragEnd}
			>
				<h3 class="mb-4 inline"><span class="inline">{selectedSystem}</span> <input type="number" min="1" max="999" id="number-field-{team.num}"
																																										class="input-number mx-3 w-14 text-sm text-white bg-white border border-gray-600 dark:bg-gray-700 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
																																										value="{team.num}"
																																										on:change={(event) => changeTeamNumber(team.num, event.target)} />
				</h3>

				<div class="form-container">
					<div class="name-group">
						<!-- TODO (low priority): When the team lead field is changed, check if the user already has a team. If yes, warn the user to change the other beforehand -->
						<label for="team-name-{team.num}" class="block">Team Lead</label>
						<input type="text" id="team-name-{team.num}" value="{team.leader}" class="input-field block"
									 placeholder="Enter Team Lead Name"
									 on:input={(event) => updateTeamAttribute(team.num, "leader", event.target)} />
					</div>
					<div class="status-group">
						<label for="team-lead-{team.num}" class="block">Team Status</label>
						<select id="team-lead-{team.num}" bind:value={TEAMS[team.position - 1].status} class="selector block rounded-none"
										on:input={(event) => updateTeamAttribute(team.num, "status", event.target)}>
							{#each getStatusList() as status}
								<option value={status.name}>{status.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="relative bottom-0 left-0 p-2">
					<button on:click={() => moveToFirst(team.num)} class="btn">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" color="currentColor"
								 class="shrink-0 mr-2 h-6 w-6 text-white dark:text-white" role="img" aria-label="skip-first outline"
								 viewBox="0 0 24 24"><title>first_page</title>
							<g fill="#F7F7F7">
								<path d="M18.41 16.59 13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41zM6 6h2v12H6V6z"></path>
							</g>
						</svg>
						Move to first position
					</button>
					<button on:click={() => moveToLast(team.num)} class="btn">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" color="currentColor"
								 class="shrink-0 mr-2 h-6 w-6 text-white dark:text-white" role="img" aria-label="skip-last outline"
								 viewBox="0 0 24 24"><title>last_page</title>
							<g fill="#F7F7F7">
								<path d="M5.59 7.41 10.18 12l-4.59 4.59L7 18l6-6-6-6-1.41 1.41zM16 6h2v12h-2V6z"></path>
							</g>
						</svg>
						Move to last position
					</button>
					<button on:click={() => removeTeam(team.num)} class="btn btn-red">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" color="currentColor"
								 class="shrink-0 mr-2 h-6 w-6 text-white dark:text-white" role="img" aria-label="trash outline"
								 viewBox="0 0 24 24">
							<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
										d="M6 18L18 6M6 6l12 12"></path>
						</svg>
						Delete
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>