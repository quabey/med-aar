<script>
	import { toast } from 'svelte-french-toast';
	import { sections, times, ships, injuries, extraction, texts } from '$lib/stores.js';
	import { Button, Textarea } from 'flowbite-svelte';
	import { convertToUnixTimestamp } from '$lib/AAR/helper.js';

	let finalMessage = '';
	function createMessage() {
		let message = '';
		$sections.forEach((section) => {
			console.log('adding section', section.name);
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
				case 'extraction':
					message += createExtractionMessage();
					break;
			}
			if (section.name.includes('text')) {
				console.log('adding text', section.name);
				message += createTextMessage();
			}
			message += '\n';
		});

		// remove leading newlines if there are any
		message = message.replace(/^\n+/, '');

		finalMessage = message;
	}
	function createTimingMessage() {
		console.log($times);
		let message = '## Timing\n';
		for (let [key, value] of Object.entries($times)) {
			if (value !== 'unknown') {
				message += `**${key}:** <t:${convertToUnixTimestamp(value)}:t>\n`;
			}
		}
		if (message === '## Timing\n') {
			return '';
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
		if (message === '## Injuries\n') {
			message += 'No injuries reported\n';
		}
		return message;
	}

	function createExtractionMessage() {
		if ($extraction != 'none') {
			let message = '## Extraction\n';
			message += `The client was extracted to ${$extraction}\n`;
			return message;
		} else {
			return '';
		}
	}

	function createTextMessage() {
		console.log('texts', $texts);
		let message = '';
		$texts.forEach((text) => {
			if (text.title != '' && text.content != '') {
				console.log('adding this text', text);
				message += `## ${text.title}\n${text.content}\n`;
			}
		});
		return message;
	}

	function copy() {
		navigator.clipboard.writeText(finalMessage);
		toast.success('Copied to clipboard', {
			style: 'background-color: #2c5278; color: white;',
			position: 'top-right'
		});
	}

	createMessage();
</script>

<div class="">
	<Textarea
		id="message"
		placeholder="Message Preview..."
		class=""
		rows="16"
		bind:value={finalMessage}
	/>
	<Button on:click={copy}>Copy Message</Button>
</div>
