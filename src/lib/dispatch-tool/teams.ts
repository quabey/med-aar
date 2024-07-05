interface Team {
	num: number;
	leader: string;
	status: string;
}


export function loadTeams(): Team[] {
	try {
		const teams = localStorage.getItem("teams");
		if (teams) {
			return JSON.parse(teams);
		}
	} catch (error) {}

	try {
		localStorage.setItem("teams", JSON.stringify([]));
	}
	catch (error) {}
	return [];
}

export function formatComponents(html: string): Team[] {
	return [];
}

export function saveTeams(teams: Team[]) {
	try {
		localStorage.setItem("teams", JSON.stringify(teams));
	}
	catch (error) {}
}

