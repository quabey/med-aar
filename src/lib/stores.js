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
	head: 'Unknown',
	chest: 'Unknown',
	leftArm: 'Unknown',
	rightArm: 'Unknown',
	leftLeg: 'Unknown',
	rightLeg: 'Unknown'
});

export const sections = writable([
	{ id: 0, name: 'timing' },
	{ id: 1, name: 'ships' },
	{ id: 2, name: 'injury' }
]);

export const dndItems = writable([
	{ id: 0, name: 'timing' },
	{ id: 1, name: 'ships' },
	{ id: 2, name: 'injury' }
]);
