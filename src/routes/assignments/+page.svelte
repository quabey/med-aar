<script>
	import { assignmentPlayers, assignmentShips } from '$lib/stores.js';
	import { Button, Card, Select, Label, Input } from 'flowbite-svelte';
	import { ChevronRightOutline } from 'flowbite-svelte-icons';
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

	function copyAssignments() {
		let message = '';

		if ($assignmentPlayers.gunship.length > 0 && $assignmentPlayers.gunship[0] !== '') {
			message += `**__Gunship__** *${$assignmentShips.gunship ?? ''}*\n`;
			$assignmentPlayers.gunship.forEach((player) => {
				message += `> ${player}\n`;
			});
		}
		if ($assignmentPlayers.medship.length > 0 && $assignmentPlayers.medship[0] !== '') {
			message += `**__Medship__** *${$assignmentShips.medship ?? ''}*\n`;
			$assignmentPlayers.medship.forEach((player) => {
				message += `> ${player}\n`;
			});
		}
		if ($assignmentPlayers.qrf.length > 0 && $assignmentPlayers.qrf[0] !== '') {
			message += `**__QRF__**\n`;
			$assignmentPlayers.qrf.forEach((player) => {
				message += `> ${player}\n`;
			});
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
	}
</script>

<svelte:head>
	<title>Assignments</title>
</svelte:head>

<div class="flex justify-center pb-12">
	<div class="my-2 flex w-full flex-col items-center gap-2">
		<div class="flex flex-row gap-3">
			<Button on:click={copyAssignments}>Copy</Button>
			<Button on:click={clearAssignments}>Clear</Button>
		</div>
		<Card size="lg">
			<div class="flex flex-row items-center gap-7">
				<span class="text-lg font-bold uppercase text-white">Gunship</span>
				<Select
					items={gunshipOptions}
					bind:value={$assignmentShips.gunship}
					placeholder="Choose a gunship..."
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
						<div class="">
							<Button
								on:click={() => movePlayer(player, 'gunship', 'medship')}
								class="pl-1"
								size="sm"
							>
								<ChevronRightOutline class="m-0 scale-110" />
								Medship
							</Button>
							<Button on:click={() => movePlayer(player, 'gunship', 'qrf')} class="pl-1" size="sm">
								<ChevronRightOutline class="m-0 scale-110" />
								QRF
							</Button>
						</div>
					</div>
				{/each}
			</div>
		</Card>
		<Card size="lg">
			<div class="flex flex-row items-center gap-7">
				<span class="text-lg font-bold uppercase text-white">Medship</span>
				<Select
					items={medshipOptions}
					bind:value={$assignmentShips.medship}
					placeholder="Choose a medship..."
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
						<div class="">
							<Button
								on:click={() => movePlayer(player, 'medship', 'gunship')}
								class="pl-1"
								size="sm"
							>
								<ChevronRightOutline class="m-0 scale-110" />
								Gunship
							</Button>
							<Button on:click={() => movePlayer(player, 'medship', 'qrf')} class="pl-1" size="sm">
								<ChevronRightOutline class="m-0 scale-110" />
								QRF
							</Button>
						</div>
					</div>
				{/each}
			</div>
		</Card>
		<!-- QRF Card, doenst have a ship select -->
		<Card size="lg">
			<div class="flex flex-row items-center gap-7">
				<span class="text-lg font-bold uppercase text-white">QRF</span>
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
						<div class="">
							<Button on:click={() => movePlayer(player, 'qrf', 'gunship')} class="pl-1" size="sm">
								<ChevronRightOutline class="m-0 scale-110" />
								Gunship
							</Button>
							<Button on:click={() => movePlayer(player, 'qrf', 'medship')} class="pl-1" size="sm">
								<ChevronRightOutline class="m-0 scale-110" />
								Medship
							</Button>
						</div>
					</div>
				{/each}
			</div>
		</Card>
	</div>
</div>
