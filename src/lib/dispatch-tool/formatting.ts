
export enum Color {
	Red = "red",
	Green = "green",
	Orange = "orange",
	Blue = "blue",
	Pink = "pink",
	Cyan = "cyan",
	White = "white",
	Gray = "gray",
}

interface ColorInformation {
	color: string;
	background: string;
	name: string;
	hex: string;
}

const FORMATTING = {
	"red": {"color": "[2;31m", "background": "[2;41m", "name": "Red", "hex": "#dc3030"},
	"green": {"color": "[2;32m", "background": "[2;42m", "name": "Green", "hex": "#35d110"},
	"orange": {"color": "[2;33m", "background": "[2;43m", "name": "Orange", "hex": "#f8a900"},
	"blue": {"color": "[2;34m", "background": "[2;44m", "name": "Blue", "hex": "#278bd2"},
	"pink": {"color": "[2;35m", "background": "[2;45m", "name": "Pink", "hex": "#d33677"},
	"cyan": {"color": "[2;36m", "background": "[2;46m", "name": "Cyan", "hex": "#2aa198"},
	"white": {"color": "[2;37m", "background": "[2;47m", "name": "White", "hex": "#ffffff"},
	"gray": {"color": "[2;30m", "background": "[2;40m", "name": "Gray", "hex": "#4e5058"},
}
const FORMATTING_RESET = "[0m";
const DEFAULT_STATUS_LIST = {
	"Available": { color: "green", pos: 0 },
	"Alert": { color: "red", input: { type: "text", placeholder: "Alert name" }, pos: 1 },
	"Beacon": { color: "red", input: { type: "text", placeholder: "Beacon name" }, pos: 2 },
	"RTB": { color: "cyan", pos: 3 },
	"Mustering": { color: "blue", pos: 4 },
	"Refitting": { color: "blue", pos: 5 },
	"Unavailable": { color: "orange", pos: 6 },
}

export function format(text: string, color: Color) {
	return `${FORMATTING[color].color}${text}${FORMATTING_RESET}`;
}

export function getColorInformation(color: Color): ColorInformation {
	return FORMATTING[color];
}

export function getFormattedColorList() {
	const colorList: ColorInformation[] = [];
	for (const color in FORMATTING) {
		colorList.push(FORMATTING[color]);
	}
	return colorList;
}