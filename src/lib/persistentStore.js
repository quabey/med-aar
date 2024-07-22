// src/lib/persistentStore.js
import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export function persistentWritable(key, initialValue) {
	let data;

	if (browser) {
		const storedValue = localStorage.getItem(key);
		data = storedValue ? JSON.parse(storedValue) : initialValue;
	} else {
		data = initialValue;
	}

	const store = writable(data);

	if (browser) {
		store.subscribe((value) => {
			localStorage.setItem(key, JSON.stringify(value));
		});
	}

	return store;
}
