import { writable } from 'svelte/store';

export const times = writable({
	received: 'unknown',
	start: 'unknown',
	departed: 'unknown',
	reached: 'unknown',
	completed: 'unknown'
});

export const ships = writable({
	gunship: '',
	medship: '',
	qrf: []
});

export const otherShips = writable({
	gunship: '',
	medship: ''
});

export const injuries = writable({
	head: 'None',
	chest: 'None',
	leftArm: 'None',
	rightArm: 'None',
	leftLeg: 'None',
	rightLeg: 'None'
});

export const injuriesTreatment = writable('None');

export const sections = writable([
	{ id: 0, name: 'ships' },
	{ id: 1, name: 'timing' },
	{ id: 2, name: 'location' },
	{ id: 3, name: 'injury' },
	{ id: 4, name: 'alert breakdown' },
	{ id: 5, name: 'vod' },
	{ id: 6, name: 'extraction' }
]);

export const extraction = writable('');
export const location = writable('');
export const locationDistance = writable('');

export const texts = writable([
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

export const alertBreakdown = writable('');
export const incidentReport = writable('');

export const vod = writable({
	url: '',
	timestamps: false,
	commsAllowed: false
});

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
	vod.set({
		url: '',
		timestamps: false,
		commsAllowed: false
	});
}

// ============= Copy-paste ============= //

export const hasNitro = writable(false);
export const isMRBlack = writable(false);

// ============= Settings ============= //
export const settingsModal = writable(false);
export const settings = writable({
	debug: false,
	medrunnerBlackMember: false
});
export const defaultSections = writable([
	{ id: 0, name: 'ships' },
	{ id: 1, name: 'timing' },
	{ id: 2, name: 'location' },
	{ id: 3, name: 'injury' },
	{ id: 4, name: 'alert breakdown' },
	{ id: 5, name: 'extraction' }
]);

// ============= Assignments ============= //
export const assignmentShips = writable({
	gunship: '',
	medship: ''
});

export const assignmentPlayers = writable({
	medship: [],
	gunship: [],
	qrf: []
});

export const pilotAssignments = writable({
	gunship: '',
	medship: ''
});
