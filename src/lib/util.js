export function formatName(name) {
	let formatted = name.replace(/([A-Z])/g, ' $1').trim();
	return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function capitalizeFirstLetters(string) {
	let words = string.split(' ');
	let capitalizedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));
	return capitalizedWords.join(' ');
}