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

	import { toast } from 'svelte-french-toast';
	import { Button, Input, Label, Modal, NumberInput, Select } from 'flowbite-svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';

	// TODO: Add input field when an input field is specified in the status list
	// TODO: Add the settings menu back in
	// TODO SETTINGS: Add functionality to change elements per row
	// TODO SETTINGS: Add functionality to change the status list and their colors

	$: TEAMS = loadTeams();

	let clearModal = false;

	function addTeam() {
		let newNum = 1;
		while (TEAMS.find((team) => team.num === newNum)) {
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
		TEAMS = TEAMS.filter((team) => team.num !== teamNum);
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
		if (TEAMS.find((team) => team.num === newNum)) {
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
		let team = TEAMS.find((team) => team.num === teamNum);
		team.num = newNum;

		let component = document.querySelector(`[data-team="${teamNum}"]`);
		component.setAttribute('data-team', `${newNum}`);

		saveTeams(TEAMS);

		toast.success(
			'Changed ' + selectedSystem + ' ' + teamNum + ' to ' + selectedSystem + ' ' + newNum,
			{
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			}
		);
	}

	let selectedSystem = getSelectedSystem();

	function copyFeed() {
		if (TEAMS.length === 0) {
			toast.error('You need to have at least one team to copy the feed', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
			return;
		}
		try {
			navigator.clipboard.writeText(generateFeed(selectedSystem, TEAMS));
			toast.success('Feed copied', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
		} catch (error) {
			toast.error('Error copying feed, please try again', {
				style: 'background-color: #2c5278; color: white;',
				position: 'top-right'
			});
			console.error(error);
		}
	}

	let dragStartIndex;

	function dragStart() {
		dragStartIndex = +this.getAttribute('data-index');
		this.classList.add('opacity-50');
		this.classList.add('z-100');
	}

	function dragOver(e) {
		e.preventDefault();
		this.classList.add('border-black');
		this.classList.add('dark:border-white');
	}

	function dragEnter() {
		this.classList.add('border-black');
		this.classList.add('dark:border-white');
	}

	function dragLeave() {
		this.classList.remove('border-black');
		this.classList.remove('dark:border-white');
	}

	function dragDrop() {
		const dragEndIndex = +this.getAttribute('data-index');
		swapComponents(dragStartIndex, dragEndIndex);
		this.classList.remove('border-black');
		this.classList.remove('dark:border-white');
	}

	function dragEnd() {
		this.classList.remove('border-black');
		this.classList.remove('dark:border-white');
		this.classList.remove('opacity-50');
		this.classList.remove('z-100');
	}

	function moveToFirst(teamNum) {
		// Increment the position of all teams that are above the team that is being moved
		TEAMS.forEach((team) => {
			if (team.num === teamNum) {
				team.position = 1;
			} else if (team.position < TEAMS.find((team) => team.num === teamNum).position) {
				team.position++;
			}
		});
		TEAMS = rerenderTeams(TEAMS);
	}

	function moveToLast(teamNum) {
		// Set the position of the team that is being moved to the last position and let the rerender handle the correction of the positions
		TEAMS.find((team) => team.num === teamNum).position = TEAMS.length + 1;
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
		let team = TEAMS.find((team) => team.num === teamNum);
		team[field] = inputField.value;
		console.log(team);
		TEAMS = rerenderTeams(TEAMS);
	}
</script>

<svelte:head>
	<title>Dispatch Tool</title>
	<meta property="og:title" content="Dispatch Tool - Med-Tools" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`https://med-tools.space`} />
</svelte:head>

<Modal bind:open={clearModal} size="xs" autoclose>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you sure you want to clear <b>all</b> teams?
		</h3>
		<Button color="red" class="me-2" on:click={() => (TEAMS = rerenderTeams([]))}
			>Yes, I'm sure</Button
		>
		<Button color="alternative" on:click={() => (clearModal = false)}>No, cancel</Button>
	</div>
</Modal>

<div class="max-w-8xl m-auto w-full justify-center sm:p-4 md:w-[70rem]">
	<div class="my-2 grid w-full grid-cols-3 items-center gap-4 px-5">
		<Button
			on:click={addTeam}
			class="bg-lime-700 focus-within:ring-lime-300 hover:bg-lime-900 dark:bg-lime-700 dark:focus-within:ring-lime-800 dark:hover:bg-lime-900"
		>
			<svg
				aria-label="plus outline"
				class="mr-2 ms-2 h-6 w-6 shrink-0 text-white dark:text-white"
				color="currentColor"
				fill="none"
				role="img"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M5 12h14m-7 7V5"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
				></path>
			</svg>
			New Team
		</Button>
		<Button on:click={copyFeed}>
			<svg
				aria-label="copy filled"
				class="mr-2 ms-2 h-6 w-6 shrink-0 text-white dark:text-white"
				color="currentColor"
				role="img"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				><title>file_copy</title>
				<g fill="#F7F7F7">
					<path
						d="M15 1H4c-1.1 0-2 .9-2 2v13c0 .55.45 1 1 1s1-.45 1-1V4c0-.55.45-1 1-1h10c.55 0 1-.45 1-1s-.45-1-1-1zm.59 4.59 4.83 4.83c.37.37.58.88.58 1.41V21c0 1.1-.9 2-2 2H7.99C6.89 23 6 22.1 6 21l.01-14c0-1.1.89-2 1.99-2h6.17c.53 0 1.04.21 1.42.59zM15 12h4.5L14 6.5V11c0 .55.45 1 1 1z"
					></path>
				</g>
			</svg>
			Copy Feed
		</Button>
		<Button
			class="bg-red-700 focus-within:ring-red-300 hover:bg-red-900 dark:bg-red-700 dark:focus-within:ring-red-800 dark:hover:bg-red-900"
			on:click={() => (clearModal = true)}
		>
			<svg
				aria-label="trash outline"
				class="mr-2 h-6 w-6 shrink-0 text-white dark:text-white"
				color="currentColor"
				fill="none"
				role="img"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M6 18L18 6M6 6l12 12"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
				></path>
			</svg>
			Delete all teams
		</Button>
	</div>
	<div class="my-2 grid w-full grid-cols-1 items-center px-5">
		<Select bind:value={selectedSystem} items={dropdownSystems()} />
	</div>
	<div
		class="my-2 grid w-full grid-cols-1 items-center gap-4 px-5 xl:grid-cols-2"
		id="draggable-wrapper"
	>
		{#each TEAMS as team}
			<div
				class="rounded-lg border border-gray-200 bg-gray-900 p-3 hover:cursor-move hover:border-white dark:border-gray-700 dark:bg-gray-900"
				aria-controls="team-name team-lead"
				role="group"
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
				<h3 class="mb-4 inline">{selectedSystem}</h3>
				<NumberInput
					min="1"
					max="999"
					id="number-field-{team.num}"
					class="mx-3 inline w-14 border border-gray-600 bg-white text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-700"
					value={team.num}
					on:change={(event) => changeTeamNumber(team.num, event.target)}
				/>

				<div class="grid grid-cols-3 rounded-lg p-2">
					<div class="col-span-2 mb-2 block">
						<!-- TODO (low priority): When the team lead field is changed, check if the user already has a team. If yes, warn the user to change the other beforehand -->
						<Label for="team-name-{team.num}" class="block">Team Lead</Label>
						<Input
							id="team-name-{team.num}"
							value={team.leader}
							class="block rounded-none"
							placeholder="Enter Team Lead Name"
							on:input={(event) => updateTeamAttribute(team.num, 'leader', event.target)}
						/>
					</div>
					<div class="col-span-1 mb-2 block">
						<Label for="team-lead-{team.num}" class="block">Team Status</Label>
						<Select
							id="team-lead-{team.num}"
							items={dropdownStatuses()}
							bind:value={TEAMS[team.position - 1].status}
							class="block rounded-none"
							on:input={(event) => updateTeamAttribute(team.num, 'status', event.target)}
						/>
					</div>
				</div>

				<div class="grid grid-cols-3 rounded-lg p-2">
					<div class="col-span-3 mb-2 block">
						{#if getStatus(team.status).input !== undefined}
							<Input
								id="team-comment-{team.num}"
								value={team.comment || ''}
								class="block"
								placeholder={getStatus(team.status).input}
								on:input={(event) => updateTeamAttribute(team.num, 'comment', event.target)}
							/>
						{:else}
							<Input class="invisible" id="consistency-preserver-{team.num}" />
						{/if}
					</div>
				</div>
				<div class="bottom-0 left-0 flex justify-between p-1">
					<Button on:click={() => moveToFirst(team.num)} class="btn">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							color="currentColor"
							class="mr-2 h-5 w-5 shrink-0 text-white dark:text-white"
							role="img"
							aria-label="skip-first outline"
							viewBox="0 0 24 24"
							><title>first_page</title>
							<g fill="#F7F7F7">
								<path d="M18.41 16.59 13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41zM6 6h2v12H6V6z"
								></path>
							</g>
						</svg>
						Move to first
					</Button>
					<Button on:click={() => moveToLast(team.num)} class="btn">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							color="currentColor"
							class="mr-2 h-5 w-5 shrink-0 text-white dark:text-white"
							role="img"
							aria-label="skip-last outline"
							viewBox="0 0 24 24"
							><title>last_page</title>
							<g fill="#F7F7F7">
								<path d="M5.59 7.41 10.18 12l-4.59 4.59L7 18l6-6-6-6-1.41 1.41zM16 6h2v12h-2V6z"
								></path>
							</g>
						</svg>
						Move to last
					</Button>
					<Button
						on:click={() => removeTeam(team.num)}
						class="bg-red-700 focus-within:ring-red-300 hover:bg-red-900 dark:bg-red-700 dark:focus-within:ring-red-800 dark:hover:bg-red-900"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							color="currentColor"
							class="mr-2 h-5 w-5 shrink-0 text-white dark:text-white"
							role="img"
							aria-label="trash outline"
							viewBox="0 0 24 24"
						>
							<path
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
						Delete
					</Button>
				</div>
			</div>
		{/each}
	</div>
</div>

<footer>
	<div class="mx-auto w-full max-w-screen-xl p-4 md:py-8">
		<hr class="my-6 border-gray-200 dark:border-gray-700 sm:mx-auto lg:my-8" />
		<span class="block text-sm text-gray-500 dark:text-gray-400 sm:text-center"
			>It is known, that the ability to customize your own statuses is not yet included.</span
		>
		<span class="block text-sm text-gray-500 dark:text-gray-400 sm:text-center"
			>Due to the refactor needed to implement the code into this website, it may take a while until
			the feature is added back in, depending on my workload.</span
		>
		<span class="block text-sm text-gray-500 dark:text-gray-400 sm:text-center"
			>Until then, feel free to use the "standalone" version of the Dispatch Tool, if you want to
			use this feature.</span
		>
	</div>
</footer>
