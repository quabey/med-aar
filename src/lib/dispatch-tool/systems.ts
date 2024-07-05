export enum System {
	STANTON = 'Stanton',
}

export function getAllSystems(): System[] {
	return Object.values(System);
}

export function getSelectedSystem(): System | null {
	try {
		const selected = localStorage.getItem('selected-system') || System.STANTON;
		if (selected) {
			return selected as System;
		}
		if (!getAllSystems().includes(selected as System)) {
			return System.STANTON;
		}
	}
	catch (error) {}
	return System.STANTON;
}

export function setSelectedSystem(system: System) {
	try {
		localStorage.setItem('selected-system', system);
	} catch (error) {}
	return system;
}