import { get } from 'svelte/store';
import { sections, times, ships, injuries, extraction, texts } from '../stores.js';
import { convertToUnixTimestamp } from './helper.js';

export function createMessage() {
	const sectionsData = get(sections);
	const timesData = get(times);
	const shipsData = get(ships);
	const injuriesData = get(injuries);
	const extractionData = get(extraction);
	const textsData = get(texts);

	let message = '';
	sectionsData.forEach((section) => {
		console.log('adding section', section.name);
		switch (section.name) {
			case 'timing':
				message += createTimingMessage(timesData);
				break;
			case 'ships':
				message += createShipsMessage(shipsData);
				break;
			case 'injury':
				message += createInjuryMessage(injuriesData);
				break;
			case 'extraction':
				message += createExtractionMessage(extractionData);
				break;
		}
		if (section.name.includes('text')) {
			console.log('adding text', section.name);
			message += createTextMessage(textsData);
		}
		message += '\n';
	});
	console.log('message', message);
	return message;
}

function createTimingMessage(times) {
	console.log(times);
	let message = '**Timing**\n';
	for (let [key, value] of Object.entries(times)) {
		if (value !== 'unknown') {
			message += `${key}: <t:${convertToUnixTimestamp(value)}:t>\n`;
		}
	}
	if (message === '## Timing\n') {
		return '';
	}
	return message;
}

function createShipsMessage(ships) {
	console.log(ships);
	let message = '**Ships**\n';
	message += `Medical Ship: ${ships.medship == '' ? 'Unknown' : ships.medship}\n`;
	message += `Gunship: ${ships.gunship == '' ? 'Unknown' : ships.gunship}\n`;
	if (ships.qrf.length > 0 && ships.qrf[0] !== '') {
		message += `QRF: ${ships.qrf.join(', ')}\n`;
	}
	return message;
}

function createInjuryMessage(injuries) {
	let message = '**Injuries**\n';
	for (let [key, value] of Object.entries(injuries)) {
		if (value !== 'None') {
			// for every char in the key check if its uppercase and replace it with a space and the lowercase letter
			key = key.replace(/([A-Z])/g, ' $1').toLowerCase();
			key = message += `${key}: ${value}\n`;
		}
	}
	if (message === '**Injuries**\n') {
		message += 'No injuries reported\n';
	}
	return message;
}

function createExtractionMessage(extraction) {
	if (extraction !== 'none') {
		let message = '## Extraction\n';
		message += `The client was extracted to ${extraction}\n`;
		return message;
	} else {
		return '';
	}
}

function createTextMessage(texts) {
	console.log('texts', texts);
	let message = '';
	texts.forEach((text) => {
		if (text.title !== '' && text.content !== '') {
			console.log('adding this text', text);
			message += `## ${text.title}\n${text.content}\n`;
		}
	});
	return message;
}
