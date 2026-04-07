export const MEDRUNNER_ROLES = {
	1: { name: 'Medic', abbreviation: 'MED', emote: '' },
	2: { name: 'Security', abbreviation: 'SEC', emote: '' },
	3: { name: 'Pilot', abbreviation: 'PIL', emote: '' },
	4: { name: 'Team Lead', abbreviation: 'LEAD', emote: '' },
	5: { name: 'Dispatch', abbreviation: 'DIS', emote: '' },
	6: { name: 'Dispatch Lead', abbreviation: 'LDIS', emote: '' },
	7: { name: 'Dispatch Trainee', abbreviation: 'DIST', emote: '' },
	8: { name: 'Dispatch Observer', abbreviation: 'DSO', emote: '' },
	9: { name: 'Combat Aerospace Patrol', abbreviation: 'CAP', emote: '' },
	10: { name: 'Logistics', abbreviation: 'LOG', emote: '' }
};

export function getRoleLabel(classId) {
	const role = MEDRUNNER_ROLES[classId];
	return role ? role.abbreviation : '???';
}

export function getRoleName(classId) {
	const role = MEDRUNNER_ROLES[classId];
	return role ? role.name : 'Unknown';
}
