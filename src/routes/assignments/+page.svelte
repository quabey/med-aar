<script>
	import { assignmentPlayers, assignmentShips, pilotAssignments } from '$lib/stores.js';
	import {
		Button,
		Card,
		Select,
		Label,
		Input,
		Badge,
		Checkbox,
		ButtonGroup,
		Modal
	} from 'flowbite-svelte';
	import { onMount, onDestroy } from 'svelte';
	import {
		ChevronRightOutline,
		UserRemoveOutline,
		ChevronDoubleUpOutline
	} from 'flowbite-svelte-icons';
	import { get } from 'svelte/store';

	const medshipOptions = [
		{ name: 'Cutlass Red', value: 'Cutlass Red' },
		{ name: 'Pisces Rescue', value: 'Pisces Rescue' },
		{ name: 'Carrack', value: 'Carrack' },
		{ name: 'Origin 890J', value: 'Origin 890J' }
	];
	const gunshipOptions = [
		{ name: 'Aegis Redeemer', value: 'Aegis Redeemer' },
		{ name: 'RSI Constellation X', value: 'RSI Constellation X' },
		{ name: 'Drake Corsair', value: 'Drake Corsair' },
		{ name: 'Aegis Vanguard Hoplite', value: 'Aegis Vanguard Hoplite' }
	];

	let newGunshipPlayer = '';
	let newMedshipPlayer = '';
	let newQRFPlayer = '';
	let watermark = false;
	let appModal = true;

	function movePlayer(player, fromKey, toKey) {
		const players = get(assignmentPlayers);
		const from = players[fromKey];
		const to = players[toKey];

		from.splice(from.indexOf(player), 1);
		to.push(player);

		assignmentPlayers.update((value) => {
			value[fromKey] = [...from];
			value[toKey] = [...to];
			return value;
		});
	}

	function addMedPlayer(playerName) {
		if (playerName.trim() !== '') {
			assignmentPlayers.update((players) => {
				players.medship = [...players.medship, playerName];
				return players;
			});
			newMedshipPlayer = '';
		}
	}

	function addGunPlayer(playerName) {
		if (playerName.trim() !== '') {
			assignmentPlayers.update((players) => {
				players.gunship = [...players.gunship, playerName];
				return players;
			});
			newGunshipPlayer = '';
		}
	}

	function addQRFPlayer(playerName) {
		if (playerName.trim() !== '') {
			assignmentPlayers.update((players) => {
				players.qrf = [...players.qrf, playerName];
				return players;
			});
			newQRFPlayer = '';
		}
	}

	// Remove player from the any list
	function removePlayer(playerName) {
		if (playerName.trim() !== '') {
			assignmentPlayers.update((players) => {
				players.qrf = players.qrf.filter((player) => player !== playerName);
				players.medship = players.medship.filter((player) => player !== playerName);
				players.gunship = players.gunship.filter((player) => player !== playerName);
				return players;
			});
		}
	}

	function copyAssignments() {
		let message = '';

		if ($assignmentPlayers.gunship.length > 0 && $assignmentPlayers.gunship[0] !== '') {
			message += `**__Gunship__** ${$assignmentShips.gunship ?? ''} ${$pilotAssignments.gunship ? ' - *Pilot: ' + $pilotAssignments.gunship.trim() : ''}* \n`;
			$assignmentPlayers.gunship.forEach((player) => {
				message += `> ${player}\n`;
			});
			message += '\n';
		}
		if ($assignmentPlayers.medship.length > 0 && $assignmentPlayers.medship[0] !== '') {
			message += `**__Medship__** *${$assignmentShips.medship ?? ''} ${$pilotAssignments.medship ? ' - Pilot: ' + $pilotAssignments.medship.trim() : ''} * \n`;
			$assignmentPlayers.medship.forEach((player) => {
				message += `> ${player}\n`;
			});
			message += '\n';
		}
		if ($assignmentPlayers.qrf.length > 0 && $assignmentPlayers.qrf[0] !== '') {
			message += `**__Additional Ships / QRF__**\n`;
			$assignmentPlayers.qrf.forEach((player) => {
				message += `> ${player}\n`;
			});
		}
		if (watermark) {
			message += '\nMade with [med-tools.space](https://med-tools.space/assignments)';
		}
		console.log(message);
		navigator.clipboard.writeText(message);
	}

	function clearAssignments() {
		assignmentPlayers.update((players) => {
			players.gunship = [];
			players.medship = [];
			players.qrf = [];
			return players;
		});
		assignmentShips.update((ships) => {
			ships.gunship = '';
			ships.medship = '';
			return ships;
		});
		pilotAssignments.update((pilots) => {
			pilots.gunship = '';
			pilots.medship = '';
			return pilots;
		});
	}

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			const activeElementId = document.activeElement.id;
			if (activeElementId === 'gunship_player') {
				addGunPlayer(newGunshipPlayer);
			} else if (activeElementId === 'medship_player') {
				addMedPlayer(newMedshipPlayer);
			} else if (activeElementId === 'qrf_player') {
				addQRFPlayer(newQRFPlayer);
			}
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});
</script>

<svelte:head>
	<title>Assignments</title>
</svelte:head>

<div class="flex justify-center pb-12">
	<div class="my-2 flex w-full flex-col items-center gap-2">
		<div class="flex flex-row gap-3">
			<Button on:click={copyAssignments}>Copy</Button>
			<Button on:click={clearAssignments}>Clear</Button>
			<Checkbox bind:checked={watermark}>Add Watermark</Checkbox>
			<button on:click={() => (appModal = true)} class="ml-1 italic text-primary-300 underline">
				What is A.P.P?
			</button>
		</div>
		<Card size="lg">
			<div class="flex flex-row items-center justify-between">
				<div class="flex flex-row gap-2">
					<span class="text-lg font-bold uppercase text-white">Gunship</span>
					{#if $pilotAssignments.gunship != ''}
						<Badge color="dark">Pilot: {$pilotAssignments.gunship}</Badge>
					{/if}
				</div>
				<Select
					items={gunshipOptions}
					bind:value={$assignmentShips.gunship}
					placeholder="Choose a gunship..."
					class="w-48"
				/>
			</div>
			<div class="mb-2 mt-4 flex flex-row gap-3">
				<Input
					type="text"
					id="gunship_player"
					bind:value={newGunshipPlayer}
					placeholder="Enter player name"
					required
				/>
				<Button
					on:click={() => {
						addGunPlayer(newGunshipPlayer);
					}}
					class="w-32"
				>
					Add Player
				</Button>
			</div>
			<div class="flex flex-col gap-1">
				{#each $assignmentPlayers.gunship as player}
					<div class="flex flex-row items-center justify-between gap-2">
						<span class="text-white">{player}</span>
						<ButtonGroup class="">
							<Button
								on:click={() => movePlayer(player, 'gunship', 'medship')}
								outline
								class="pl-1 font-bold dark:border-primary-400 dark:text-primary-400"
								size="sm"
							>
								<ChevronRightOutline class="m-0 scale-110" />
								Medship
							</Button>
							<Button
								on:click={() => movePlayer(player, 'gunship', 'qrf')}
								outline
								class="pl-1 font-bold dark:border-primary-400 dark:text-primary-400"
								size="sm"
							>
								<ChevronRightOutline class="m-0 scale-110" />
								QRF
							</Button>
							<Button
								on:click={() => ($pilotAssignments.gunship = player)}
								outline
								class="px-3 font-bold dark:border-primary-400 dark:text-primary-400"
							>
								<ChevronDoubleUpOutline />
								Pilot
							</Button>
							<Button
								on:click={() => removePlayer(player)}
								outline
								class="px-3 font-bold dark:border-primary-400 dark:text-primary-400"
							>
								<UserRemoveOutline />
							</Button>
						</ButtonGroup>
					</div>
				{/each}
			</div>
		</Card>
		<Card size="lg">
			<div class="flex flex-row items-center justify-between gap-7">
				<div class="flex flex-row items-center gap-2">
					<span class="text-xl font-bold uppercase text-white">Medship</span>
					{#if $pilotAssignments.medship != ''}
						<Badge color="dark">Pilot: {$pilotAssignments.medship}</Badge>
					{/if}
				</div>
				<Select
					items={medshipOptions}
					bind:value={$assignmentShips.medship}
					placeholder="Choose a medship..."
					class="w-48"
				/>
			</div>
			<div class="mb-2 mt-4 flex flex-row gap-3">
				<Input
					type="text"
					id="medship_player"
					bind:value={newMedshipPlayer}
					placeholder="Enter player name"
					required
				/>
				<Button
					on:click={() => {
						addMedPlayer(newMedshipPlayer);
					}}
					class="w-32"
				>
					Add Player
				</Button>
			</div>
			<div class="flex flex-col gap-1">
				{#each $assignmentPlayers.medship as player}
					<div class="flex flex-row items-center justify-between gap-2">
						<span class="text-white">{player}</span>
						<ButtonGroup class="">
							<Button
								on:click={() => movePlayer(player, 'medship', 'gunship')}
								outline
								class="pl-1 font-bold dark:border-primary-400 dark:text-primary-400"
								size="sm"
							>
								<ChevronRightOutline class="m-0 scale-110" />
								Gunship
							</Button>
							<Button
								on:click={() => movePlayer(player, 'medship', 'qrf')}
								outline
								class="pl-1 font-bold dark:border-primary-400 dark:text-primary-400"
								size="sm"
							>
								<ChevronRightOutline class="m-0 scale-110" />
								QRF
							</Button>
							<Button
								on:click={() => ($pilotAssignments.medship = player)}
								outline
								class="px-3 font-bold dark:border-primary-400 dark:text-primary-400"
							>
								<ChevronDoubleUpOutline />
								Pilot
							</Button>
							<Button
								on:click={() => removePlayer(player)}
								outline
								class="px-3 font-bold dark:border-primary-400 dark:text-primary-400"
							>
								<UserRemoveOutline />
							</Button>
						</ButtonGroup>
					</div>
				{/each}
			</div>
		</Card>
		<!-- QRF Card, doenst have a ship select -->
		<Card size="lg">
			<div class="flex flex-row items-center gap-7">
				<span class="text-lg font-bold uppercase text-white">Additional Ships / QRF</span>
			</div>
			<div class="mb-2 mt-4 flex flex-row gap-3">
				<Input
					type="text"
					id="qrf_player"
					bind:value={newQRFPlayer}
					placeholder="Enter player name"
					required
				/>
				<Button
					on:click={() => {
						addQRFPlayer(newQRFPlayer);
					}}
					class="w-32"
				>
					Add Player
				</Button>
			</div>
			<div class="flex flex-col gap-1">
				{#each $assignmentPlayers.qrf as player}
					<div class="flex flex-row items-center justify-between gap-2">
						<span class="text-white">{player}</span>
						<ButtonGroup class="">
							<Button
								on:click={() => movePlayer(player, 'qrf', 'gunship')}
								outline
								class="pl-1 font-bold dark:border-primary-400 dark:text-primary-400"
								size="sm"
							>
								<ChevronRightOutline class="m-0 scale-110" />
								Gunship
							</Button>
							<Button
								on:click={() => movePlayer(player, 'qrf', 'medship')}
								outline
								class="pl-1 font-bold dark:border-primary-400 dark:text-primary-400"
								size="sm"
							>
								<ChevronRightOutline class="m-0 scale-110" />
								Medship
							</Button>
							<Button
								on:click={() => removePlayer(player)}
								outline
								class="px-3 font-bold dark:border-primary-400 dark:text-primary-400"
							>
								<UserRemoveOutline />
							</Button>
						</ButtonGroup>
					</div>
				{/each}
			</div>
		</Card>
	</div>
</div>

<Modal title="What is A.P.P?" autoclose outsideclose bind:open={appModal}>
	<div class="flex flex-col gap-2">
		<p>
			A.P.P stands for All Player Participate. This policy is in place to ensure that all players
			are actively engaged, and participating in an alert. In the case of ship assignments this
			means that every ship is only crewed as needed, and no players are forced to sit idle.
		</p>
		<span class="text-xl font-bold">Why use A.P.P ?</span>
		<p>
			At the core of A.P.P is the idea that every player should be able to participate in the alert,
			and have fun. By ensuring that every player is actively engaged, we can help to prevent
			players from feeling left out, or bored.
		</p>
		<span class="text-xl font-bold"> What is an example of A.P.P in action?</span>
		<p></p>
	</div>
</Modal>
