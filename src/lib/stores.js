// Backward-compatible stores for secondary pages (assignments, dispatch-tool, copy-pastes)
// The main AAR page uses the new tab-based state in state/tabs.svelte.js
import { writable } from 'svelte/store';

export const hasNitro = writable(false);
export const isMRBlack = writable(false);

export const settingsModal = writable(false);
export const settings = writable({
	debug: false,
	medrunnerBlackMember: false
});

export const assignmentShips = writable({
	gunship: '',
	medship: '',
	cap: ''
});

// Players are objects: { name: string, discordId?: string, role?: number }
export const assignmentPlayers = writable({
	medship: [],
	gunship: [],
	cap: []
});

export const pilotAssignments = writable({
	gunship: '',
	medship: ''
});
