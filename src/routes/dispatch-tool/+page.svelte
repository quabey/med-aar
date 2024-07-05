<script>
	import "$lib/dispatch-tool/style.css";
	import { getStatusList } from '$lib/dispatch-tool/status.ts';
	import { getAllSystems, getSelectedSystem, setSelectedSystem } from '$lib/dispatch-tool/systems.ts';
	import { loadTeams, saveTeams } from '$lib/dispatch-tool/teams.ts';

	// TODO: Add functionality to put the team first and last in queue
	// TODO: Add functionality to delete a team
	// TODO: Add functionality to copy the feed
	// TODO: Add the settings menu back in
			// TODO SETTINGS: Add functionality to change elements per row
			// TODO SETTINGS: Add functionality to change the status list and their colors

	$: TEAMS = loadTeams();

	function addTeam() {
		let maxNum = Math.max(...TEAMS.map(team => team.num), 0);
		TEAMS = [...TEAMS, { num: maxNum + 1, leader: '', status: '' }];
		saveTeams(TEAMS);
	}

	let selectedSystem = getSelectedSystem();

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
	function swapComponents(startIndex, endIndex) {
		const components = document.querySelectorAll('.draggable-component');
		const startComponent = components[startIndex - 1];
		const endComponent = components[endIndex - 1];

		let startCopy = startComponent.cloneNode(true);
		let endCopy = endComponent.cloneNode(true);

		startComponent.replaceWith(endCopy);
		endComponent.replaceWith(startCopy);

		startCopy.classList.remove('dragging');
		startCopy.classList.remove('over');
		endCopy.classList.remove('dragging');
		endCopy.classList.remove('over');

		startCopy.addEventListener('dragstart', dragStart);
		startCopy.addEventListener('dragover', dragOver);
		startCopy.addEventListener('dragenter', dragEnter);
		startCopy.addEventListener('dragleave', dragLeave);
		startCopy.addEventListener('drop', dragDrop);
		startCopy.addEventListener('dragend', dragEnd);

		endCopy.addEventListener('dragstart', dragStart);
		endCopy.addEventListener('dragover', dragOver);
		endCopy.addEventListener('dragenter', dragEnter);
		endCopy.addEventListener('dragleave', dragLeave);
		endCopy.addEventListener('drop', dragDrop);
		endCopy.addEventListener('dragend', dragEnd);

		startCopy.setAttribute('data-index', `${endIndex}`);
		endCopy.setAttribute('data-index', `${startIndex}`);
	}
</script>

<svelte:head>
	<title>Dispatch Tool</title>
</svelte:head>

<div class="justify-center pb-12">
	<div class="my-2 w-full items-center gap-4 grid grid-cols-2 px-5">
			<button on:click={addTeam} class="btn btn-green"><svg xmlns="http://www.w3.org/2000/svg" fill="none" color="currentColor" class="shrink-0 ms-2 mr-2 h-6 w-6 text-white dark:text-white" role="img" aria-label="plus outline" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"></path></svg> New Team</button>
			<button class="btn"><svg xmlns="http://www.w3.org/2000/svg" color="currentColor" class="shrink-0 ms-2 mr-2 h-6 w-6 text-white dark:text-white" role="img" aria-label="copy filled" viewBox="0 0 24 24"><title>file_copy</title><g fill="#F7F7F7"><path d="M15 1H4c-1.1 0-2 .9-2 2v13c0 .55.45 1 1 1s1-.45 1-1V4c0-.55.45-1 1-1h10c.55 0 1-.45 1-1s-.45-1-1-1zm.59 4.59 4.83 4.83c.37.37.58.88.58 1.41V21c0 1.1-.9 2-2 2H7.99C6.89 23 6 22.1 6 21l.01-14c0-1.1.89-2 1.99-2h6.17c.53 0 1.04.21 1.42.59zM15 12h4.5L14 6.5V11c0 .55.45 1 1 1z"></path></g></svg> Copy</button>
	</div>
	<div class="my-2 w-full items-center grid grid-cols-1 px-5">
		<select class="selector" bind:value={selectedSystem} on:change={() => setSelectedSystem(selectedSystem)}>
			{#each getAllSystems() as system}
				<option value={system}>{system}</option>
			{/each}
		</select>
	</div>
	<div id="draggable-wrapper" class="my-2 w-full items-center gap-4 grid grid-cols-1 xl:grid-cols-2 px-5">
		{#each TEAMS as team}
			<div class="draggable-component bg-gray-900 dark:bg-gray-900" aria-controls="team-name team-lead" role="group"
				draggable="true"
				data-index={team.num}
				data-team={team.num}
				on:dragstart={dragStart}
				on:dragover={dragOver}
				on:dragenter={dragEnter}
				on:dragleave={dragLeave}
				on:drop={dragDrop}
				on:dragend={dragEnd}
			>
				<!-- TODO: When the number field is changed, check if the team already exist. If so, revert the number back and give the user an error message -->
				<!-- TODO: When the number was changed successfully, change the details of the team and update it-->
				<h3 class="mb-4 inline"><span class="inline">{selectedSystem}</span> <input type="number" min="1" max="999" class="input-number mx-3 w-14 text-sm text-white bg-white border border-gray-600 dark:bg-gray-700 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:outline-none" value="{team.num}"/></h3>

				<div class="form-container">
					<div class="name-group">
						<!-- TODO: When the team lead field is changed and update the team accordingly -->
						<!-- TODO (low priority): When the team lead field is changed, check if the user already has a team. If yes, warn the user to change the other beforehand -->
						<label for="team-name" class="block">Team Lead</label>
						<input type="text" id="team-name" class="input-field block" placeholder="Enter Team Lead Name" />
					</div>
					<div class="status-group">
						<label for="team-lead" class="block">Team Status</label>
						<select id="team-lead" class="selector block rounded-none">
							<!-- TODO: Update the team when the status is changed -->
							{#each getStatusList() as status}
								<option value={status.name}>{status.name}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>