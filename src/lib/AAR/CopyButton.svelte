<script>
	import { sections, times, ships, injuries } from '$lib/stores.js';
	import { Button } from 'flowbite-svelte';
	import { convertToUnixTimestamp } from '$lib/AAR/helper.js';

	function copyMessage() {
		let message = createMessage();
		console.log(message);
		navigator.clipboard.writeText(message);
	}

	function createMessage() {
		let message = '';
		$sections.forEach((section) => {
			switch (section.name) {
				case 'timing':
					message += createTimingMessage();
					break;
				case 'ships':
					message += createShipsMessage();
					break;
				case 'injury':
					message += createInjuryMessage();
					break;
			}
			message += '\n';
		});
		return message;
	}
	function createTimingMessage() {
		let message = '## Timing\n';
		for (let [key, value] of Object.entries($times)) {
			message += `**${key}:** <t:${convertToUnixTimestamp(value)}:t>\n`;
		}
		return message;
	}

	function createShipsMessage() {
		console.log($ships);
		let message = '## Ships\n';
		message += `Medical Ship: ${$ships.medship}\n`;
		message += `Gunship: ${$ships.gunship}\n`;
		if ($ships.qrf.length > 0 && $ships.qrf[0] !== '') {
			message += `QRF: ${$ships.qrf.join(', ')}\n`;
		}
		return message;
	}

	function createInjuryMessage() {
		let message = '## Injuries\n';
		for (let [key, value] of Object.entries($injuries)) {
			if (value !== 'None') {
				message += `**${key}:** ${value}\n`;
			}
		}
		return message;
	}
</script>

<Button on:click={copyMessage}>Copy Message</Button>
