export interface Team {
	position: number;
	num: number;
	leader: string;
	status: string;
	comment?: string;
}

/**
 * Load the teams from the local storage
 * @returns The teams from the local storage or an empty array if there are no teams
 */
export function loadTeams(): Team[] {
	try {
		const teams = localStorage.getItem('teams');
		if (teams) {
			let teamsParsed = JSON.parse(teams);
			teamsParsed.sort((a: Team, b: Team) => a.position - b.position);

			// Check if the positions of the teams are correct, as in starting from 1 and incrementing by 1 per team
			// Fix the positions if they are not correct and save the teams into the local storage
			let position = 1;
			let changed = false;
			for (const team of teamsParsed) {
				if (team.position !== position) {
					team.position = position;
					changed = true;
				}
				position++;
			}
			if (changed) {
				saveTeams(teamsParsed);
			}

			return teamsParsed;
		}
	} catch (error) {
	}

	try {
		localStorage.setItem('teams', JSON.stringify([]));
	} catch (error) {
	}
	return [];
}

export function rerenderTeams(teams: Team[]) {
	saveTeams(teams);
	return loadTeams();
}

/**
 * Save the teams into the local storage
 * @param teams The teams to save into the local storage
 */
export function saveTeams(teams: Team[]) {
	try {
		localStorage.setItem('teams', JSON.stringify(teams));
	} catch (error) {
	}
}

