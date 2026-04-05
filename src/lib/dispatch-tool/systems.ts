export enum System {
	STANTON = 'Stanton',
	PYRO = 'Pyro',
	NYX = 'Nyx',
	TRAINING = 'Training',
}

export function getAllSystems(): System[] {
	return Object.values(System);
}

/** Map an API unit string to a System value */
export function mapUnitToSystem(unit?: string): System {
	if (!unit) return System.STANTON;
	const lower = unit.toLowerCase();
	if (lower.includes('pyro')) return System.PYRO;
	if (lower.includes('nyx')) return System.NYX;
	if (lower.includes('train')) return System.TRAINING;
	// Check for exact matches in enum values
	for (const sys of getAllSystems()) {
		if (sys.toLowerCase() === lower) return sys;
	}
	return System.STANTON;
}

export function dropdownSystems(): { name: string, value: string }[] {
	return getAllSystems().map((system) => ({ name: system, value: system }));
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
	} catch (error) {
	}
	return System.STANTON;
}

export function setSelectedSystem(system: System) {
	try {
		localStorage.setItem('selected-system', system);
	} catch (error) {
	}
	return system;
}