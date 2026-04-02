import { convertToUnixTimestamp } from './helper.js';

function capitalizeFirstLetters(string) {
	return string
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export function createMessage(data) {
	let message = '';

	for (const section of data.sections) {
		let sectionMsg = '';
		switch (section.name) {
			case 'alert type':
				sectionMsg = createAlertTypeMessage(data.alertType, data.alertTypeOther);
				break;
			case 'timing':
				sectionMsg = createTimingMessage(data.times);
				break;
			case 'ships':
				sectionMsg = createShipsMessage(data.ships, data.otherShips);
				break;
			case 'injury':
				sectionMsg = createInjuryMessage(data.injuries);
				break;
			case 'extraction':
				sectionMsg = createExtractionMessage(data.extraction);
				break;
			case 'location':
				sectionMsg = createLocationMessage(data);
				break;
			case 'alert breakdown':
				sectionMsg = createAlertBreakdownMessage(data.alertBreakdown);
				break;
			case 'incident report':
				sectionMsg = createIncidentReportMessage(data.incidentReport);
				break;
			case 'vod':
				sectionMsg = createVodMessage(data.vod);
				break;
			case 'encounters':
				sectionMsg = createEncountersMessage(data.encounters);
				break;
			case 'issues':
				sectionMsg = createIssuesMessage(data.issues);
				break;
			case 'result':
				sectionMsg = createResultMessage(data.result);
				break;
			case 'summary':
				sectionMsg = createSummaryMessage(data.summary);
				break;
			case 'intersystem response':
				sectionMsg = createIntersystemMessage(data.intersystemResponse);
				break;
			default:
				if (section.name.includes('text')) {
					sectionMsg = createTextMessage(data.texts);
				}
				break;
		}
		if (sectionMsg) message += sectionMsg + '\n';
	}

	return message.trim();
}

function createTimingMessage(times) {
	let message = '**Timing**\n';
	let hasContent = false;

	if (times.offsetMode) {
		const offsets = [
			{ key: 'offsetAlert', label: 'Alert' },
			{ key: 'offsetDepart', label: 'Depart' },
			{ key: 'offsetClient', label: 'Client' },
			{ key: 'offsetRTB', label: 'RTB' }
		];
		for (const { key, label } of offsets) {
			if (times[key] != null && times[key] !== '') {
				hasContent = true;
				message += `${label}: T+${times[key]} min\n`;
			}
		}
	} else {
		const timeFields = ['received', 'start', 'departed', 'reached', 'completed'];
		for (const field of timeFields) {
			const value = times[field];
			if (value) {
				hasContent = true;
				const label = capitalizeFirstLetters(field.replace(/([A-Z])/g, ' $1'));
				message += `${label}: <t:${convertToUnixTimestamp(value)}:t>\n`;
			}
		}
	}

	return hasContent ? message : '';
}

function createShipsMessage(ships, otherShips) {
	let gunship = ships.gunship;
	let medship = ships.medship;
	if (gunship === 'Other' && otherShips.gunship) gunship = otherShips.gunship;
	if (medship === 'Other' && otherShips.medship) medship = otherShips.medship;

	let lines = [];
	if (medship) lines.push(`Medical Ship: ${medship}`);
	if (gunship) lines.push(`Gunship: ${gunship}`);
	const capShips = ships.cap || [];
	if (capShips.length > 0) {
		lines.push(`CAP: ${capShips.join(', ')}`);
	}
	if (ships.reason) lines.push(`Reason: ${ships.reason}`);

	if (lines.length === 0) return '';
	return '**Ships Used**\n' + lines.join('\n') + '\n';
}

function createInjuryMessage(injuries) {
	let allUnknown = true;
	let message = '**Injuries**\n';
	let hasInjury = false;

	for (let [key, value] of Object.entries(injuries)) {
		if (value !== 'None') {
			hasInjury = true;
			const label = capitalizeFirstLetters(key.replace(/([A-Z])/g, ' $1'));
			message += `- ${label}: ${value}\n`;
		}
		if (value !== 'Unknown') {
			allUnknown = false;
		}
	}

	if (allUnknown) {
		return '**Injuries**\nUnknown if client had any injuries.\n';
	}
	if (!hasInjury) {
		return '**Injuries**\nNo injuries reported.\n';
	}
	return message;
}

function createExtractionMessage(extraction) {
	if (extraction === 'refused') {
		return '**Extraction**\nThe client refused extraction.\n';
	}
	if (extraction) {
		return `**Extraction**\nThe client was extracted to ${extraction}\n`;
	}
	return '';
}

function createTextMessage(texts) {
	let message = '';
	for (const text of texts) {
		if (text.title && text.content) {
			message += `**${text.title}**\n${text.content}\n`;
		}
	}
	return message;
}

function createLocationMessage(data) {
	let lines = [];
	if (data.planetaryBody) lines.push(`Planetary Body: ${data.planetaryBody}`);
	if (data.locationType) lines.push(`Location Type: ${data.locationType}`);
	if (data.location) {
		if (data.locationDistance) {
			lines.push(`Specific POI: ${data.locationDistance} ${data.location}`);
		} else {
			lines.push(`Specific POI: ${data.location}`);
		}
	}
	if (data.intersystemResponse && data.intersystemResponse.required) {
		lines.push(`Intersystem Response: Yes`);
		if (data.intersystemResponse.details) lines.push(`ISR Details: ${data.intersystemResponse.details}`);
	}
	if (lines.length === 0) return '';
	return '**Location**\n' + lines.join('\n') + '\n';
}

function createAlertBreakdownMessage(alertBreakdown) {
	if (!alertBreakdown) return '';
	return `**Alert Breakdown**\n${alertBreakdown}\n`;
}

function createIncidentReportMessage(incidentReport) {
	if (!incidentReport) return '';
	return `**Incident Report**\n${incidentReport}\n`;
}

function createVodMessage(vod) {
	if (!vod.url) return '';
	let message = '**VOD**\n';
	message += `VOD${vod.timestamps ? ' *(Includes Timestamps)*' : ''}: [VOD Link](${vod.url})\n`;
	if (vod.commsAllowed) {
		message += '*Comms Version Available to Media Team Members*\n';
	}
	return message;
}

function createAlertTypeMessage(alertType, alertTypeOther) {
	if (alertType && alertType !== 'Other') {
		return `**Alert Type: ${alertType}**\n`;
	}
	if (alertType === 'Other' && alertTypeOther) {
		return `**Alert Type (Other): ${alertTypeOther}**\n`;
	}
	return '';
}

function createEncountersMessage(encounters) {
	if (!encounters) return '';
	let lines = [];
	if (encounters.pve) lines.push(`PVE: ${encounters.pve}`);
	if (encounters.pvp) lines.push(`PVP: ${encounters.pvp}`);
	if (encounters.actionsTaken) lines.push(`Actions Taken: ${encounters.actionsTaken}`);
	if (lines.length === 0) return '';
	return '**Encounters**\n' + lines.join('\n') + '\n';
}

function createIssuesMessage(issues) {
	if (!issues) return '';
	let lines = [];
	if (issues.types && issues.types.length > 0) lines.push(`Types: ${issues.types.join(', ')}`);
	if (issues.problems) lines.push(`Problems: ${issues.problems}`);
	if (issues.briefFix) lines.push(`Brief Fix: ${issues.briefFix}`);
	if (lines.length === 0) return '';
	return '**Issues**\n' + lines.join('\n') + '\n';
}

function createResultMessage(result) {
	if (!result) return '';
	let lines = [];
	if (result.extractedTo) lines.push(`Client Extracted To: ${result.extractedTo}`);
	if (result.challenges) lines.push(`Challenges: ${result.challenges}`);
	if (result.failureReason) lines.push(`Failure/Abort Reason: ${result.failureReason}`);
	if (lines.length === 0) return '';
	return '**Result**\n' + lines.join('\n') + '\n';
}

function createSummaryMessage(summary) {
	if (!summary) return '';
	return `**Summary**\n${summary}\n`;
}

function createIntersystemMessage(intersystem) {
	if (!intersystem || !intersystem.required) return '';
	let msg = '**Intersystem Response**\nRequired: Yes\n';
	if (intersystem.details) msg += `Details: ${intersystem.details}\n`;
	return msg;
}
