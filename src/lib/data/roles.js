export const MEDRUNNER_ROLES = {
	1: { name: 'Medic', abbreviation: 'MED', emote: '' },
	2: { name: 'Security', abbreviation: 'SEC', emote: '' },
	3: { name: 'Pilot', abbreviation: 'PIL', emote: '' },
	4: { name: 'Team Lead', abbreviation: 'LEAD', emote: '' },
	9: { name: 'Close Air Patrol', abbreviation: 'CAP', emote: '' }
};

export function getRoleLabel(classId) {
	const role = MEDRUNNER_ROLES[classId];
	return role ? role.abbreviation : '???';
}

export function getRoleName(classId) {
	const role = MEDRUNNER_ROLES[classId];
	return role ? role.name : 'Unknown';
}
