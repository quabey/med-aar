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
	{ id: 2, name: 'text 1' },
	{ id: 3, name: 'injury' },
	{ id: 5, name: 'extraction' }
]);

export const extraction = writable('none');

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
	injuries.set({
		head: 'None',
		chest: 'None',
		leftArm: 'None',
		rightArm: 'None',
		leftLeg: 'None',
		rightLeg: 'None'
	});
	injuriesTreatment.set('None');
	extraction.set('none');
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
}
