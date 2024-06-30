import { get } from 'svelte/store';
import {
	sections,
	times,
	ships,
	injuries,
	extraction,
	texts,
	location,
	locationDistance,
	alertBreakdown,
	otherShips,
	injuriesTreatment,
	incidentReport
} from '../stores.js';
import { convertToUnixTimestamp } from './helper.js';

export function createMessage() {
	const sectionsData = get(sections);
	const timesData = get(times);
	const shipsData = get(ships);
	const otherShipsData = get(otherShips);
	const injuriesData = get(injuries);
	const extractionData = get(extraction);
	const textsData = get(texts);
	const locationData = get(location);
	const locationDistanceData = get(locationDistance);
	const alertBreakdownData = get(alertBreakdown);
	const injuriesTreatmentData = get(injuriesTreatment);
	const incidentReportData = get(incidentReport);

	let message = '';
	sectionsData.forEach((section) => {
		console.log('adding section', section.name);
		switch (section.name) {
			case 'timing':
				message += createTimingMessage(timesData);
				break;
			case 'ships':
				message += createShipsMessage(shipsData, otherShipsData);
				break;
			case 'injury':
				message += createInjuryMessage(injuriesData);
				break;
			case 'extraction':
				message += createExtractionMessage(extractionData);
				break;
			case 'location':
				message += createLocationMessage(locationData, locationDistanceData);
				break;
			case 'alert breakdown':
				message += createAlertBreakdownMessage(alertBreakdownData);
				break;
			case 'incident report':
				message += createIncidentReportMessage(incidentReportData);
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

function createShipsMessage(ships, otherShips) {
	console.log(ships);
	let message = '**Ships**\n';
	let gunship = ships.gunship;
	let medship = ships.medship;
	if (gunship == 'Other' && otherShips.gunship !== '') {
		gunship = otherShips.gunship;
	}
	if (medship == 'Other' && otherShips.medship !== '') {
		medship = otherShips.medship;
	}
	message += `Medical Ship: ${medship == '' ? 'Unknown' : medship}\n`;
	message += `Gunship: ${gunship == '' ? 'Unknown' : gunship}\n`;
	if (ships.qrf.length > 0 && ships.qrf[0] !== '') {
		message += `QRF: ${ships.qrf.join(', ')}\n`;
	}
	return message;
}

function createInjuryMessage(injuries) {
	let allUnknown = true;
	let message = '**Injuries**\n';
	for (let [key, value] of Object.entries(injuries)) {
		if (value !== 'None') {
			// for every char in the key check if its uppercase and replace it with a space and the lowercase letter
			key = key.replace(/([A-Z])/g, ' $1').toLowerCase();
			key = message += `- ${key}: ${value}\n`;
			if (value != 'Unknown') {
				allUnknown = false;
			}
		}
	}
	if (allUnknown) {
		message = '**Injuries**\n';
		message += 'Unknown if client had any injuries.\n';
	}
	if (message === '**Injuries**\n') {
		message += 'No injuries reported.\n';
	}
	return message;
}

function createExtractionMessage(extraction) {
	if (extraction !== 'none' && extraction !== 'refused') {
		let message = '**Extraction**\n';
		message += `The client was extracted to ${extraction}\n`;
		return message;
	} else if (extraction === 'refused') {
		return '**Extraction**\nThe client refused extraction.\n';
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
			message += `**${text.title}**\n${text.content}\n`;
		}
	});
	return message;
}

function createLocationMessage(location, locationDistance) {
	let message = '';
	if (locationDistance == '') {
		message += `**Location**\nClient Location: ${location}\n`;
	} else {
		message += `**Location**\nThe client was ${locationDistance.toLowerCase()} ${location}. \n`;
	}
	return message;
}

function createAlertBreakdownMessage(alertBreakdown) {
	if (alertBreakdown !== '') {
		let message = '**Alert Breakdown**\n';
		message += alertBreakdown;
		return message;
	}
	return '';
}

function createIncidentReportMessage(incidentReport) {
	if (incidentReport !== '') {
		let message = '**Incident Report**\n';
		message += incidentReport;
		return message;
	}
	return '';
}
