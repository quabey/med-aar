import { Color } from './formatting';

export interface Status {
	name: string;
	color: Color;
	position: number;
	input?: string;
}

export const DEFAULT_STATUS_LIST: Status[] = [
	{ name: 'Available', color: Color.Green, position: 0 },
	{ name: 'Alert', color: Color.Red, position: 1, input: 'Alert name' },
	{ name: 'Beacon', color: Color.Red, position: 2, input: 'Beacon name' },
	{ name: 'RTB', color: Color.Cyan, position: 3 },
	{ name: 'Mustering', color: Color.Blue, position: 4 },
	{ name: 'Refitting', color: Color.Blue, position: 5 },
	{ name: 'Unavailable', color: Color.Orange, position: 6 }
];

export function getStatusList(): Status[] {
	let StatusList: Status[] | undefined = undefined;

	// Load the status list from local storage
	// If the status list is not an array, or if any of the statuses are not objects with a name, color, and position, then reset the status list to the default
	try {
		const statusList = localStorage.getItem('status');
		if (statusList) {
			StatusList = JSON.parse(statusList);
			if (!Array.isArray(StatusList)) {
				StatusList = undefined;
			} else {
				for (const status of StatusList) {
					if (typeof status !== 'object' || !status.name || !status.color || !status.position) {
						StatusList = undefined;
						break;
					}
				}
			}
		}
	} catch (error) {
	}

	// If the status list is still undefined, set it to the default status list
	if (!StatusList) {
		StatusList = DEFAULT_STATUS_LIST;
	}
	return StatusList;
}

export function getStatus(status: string) {
	const StatusList = getStatusList();
	for (const s of StatusList) {
		if (s.name === status) {
			return s;
		}
	}
	return null;
}

export function saveStatusList(StatusList: Status[]) {
	localStorage.setItem('status', JSON.stringify(StatusList));
}