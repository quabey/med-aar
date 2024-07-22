import { persistentWritable } from '$lib/persistentStore';
import { writable } from 'svelte/store';

export const times = persistentWritable('times', {
	received: 'unknown',
	start: 'unknown',
	departed: 'unknown',
	reached: 'unknown',
	completed: 'unknown'
});

export const ships = persistentWritable('ships', {
	gunship: '',
	medship: '',
	qrf: []
});

export const otherShips = persistentWritable('otherShips', {
	gunship: '',
	medship: ''
});

export const injuries = persistentWritable('injuries', {
	head: 'None',
	chest: 'None',
	leftArm: 'None',
	rightArm: 'None',
	leftLeg: 'None',
	rightLeg: 'None'
});

export const injuriesTreatment = persistentWritable('injuriesTreatment', 'None');

export const sections = writable([
	{ id: 0, name: 'ships' },
	{ id: 1, name: 'timing' },
	{ id: 2, name: 'location' },
	{ id: 3, name: 'injury' },
	{ id: 4, name: 'alert breakdown' },
	{ id: 5, name: 'extraction' }
]);

export const extraction = persistentWritable('extraction', '');
export const location = persistentWritable('location', '');
export const locationDistance = persistentWritable('locationDistance', '');

export const texts = persistentWritable('texts', [
	{
		title: '',
		content: ''
	},
	{
		title: '',
		content: ''
	},
	{
		title: '',
		content: ''
	}
]);

export const alertBreakdown = persistentWritable('alertBreakdown', '');
export const incidentReport = persistentWritable('incidentReport', '');

export const vod = persistentWritable('vod', '');

export function setAllDefault() {
	times.set({
		received: 'unknown',
		start: 'unknown',
		departed: 'unknown',
		reached: 'unknown',
		completed: 'unknown'
	});
	ships.set({
		gunship: '',
		medship: '',
		qrf: []
	});
	otherShips.set({
		gunship: '',
		medship: ''
	});
	injuries.set({
		head: 'None',
		chest: 'None',
		leftArm: 'None',
		rightArm: 'None',
		leftLeg: 'None',
		rightLeg: 'None'
	});
	injuriesTreatment.set('None');
	extraction.set('');
	texts.set([
		{
			title: '',
			content: ''
		},
		{
			title: '',
			content: ''
		},
		{
			title: '',
			content: ''
		}
	]);
	alertBreakdown.set('');
	incidentReport.set('');
	location.set('');
	locationDistance.set('');
}

// ============= Copy-paste ============= //

export const hasNitro = persistentWritable('hasNitro', false);
export const isMRBlack = persistentWritable('isMRBlack', false);

// ============= Settings ============= //
export const settingsModal = writable(false); // Assuming this doesn't need persistence
export const settings = persistentWritable('settings', {
	debug: false,
	medrunnerBlackMember: false
});
export const defaultSections = persistentWritable('defaultSections', [
	{ id: 0, name: 'ships' },
	{ id: 1, name: 'timing' },
	{ id: 2, name: 'location' },
	{ id: 3, name: 'injury' },
	{ id: 4, name: 'alert breakdown' },
	{ id: 5, name: 'extraction' }
]);

// ============= Assignments ============= //
export const assignmentShips = persistentWritable('assignmentShips', {
	gunship: '',
	medship: ''
});

export const assignmentPlayers = persistentWritable('assignmentPlayers', {
	medship: [],
	gunship: [],
	qrf: []
});

export const pilotAssignments = persistentWritable('pilotAssignments', {
	gunship: '',
	medship: ''
});
