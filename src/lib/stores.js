import { writable } from 'svelte/store';

export const times = writable({
	received: 'unknown',
	start: 'unknown',
	departed: 'unknown',
	reached: 'unknown',
	completed: 'unknown'
});

export const ships = writable({
	gunship: 'unknown',
	medship: 'unknown',
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

export const sections = writable([
	{ id: 0, name: 'extraction' },
	{ id: 1, name: 'timing' },
	{ id: 2, name: 'ships' }
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
