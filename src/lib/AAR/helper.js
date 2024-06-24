export function convertToUnixTimestamp(timeString) {
	// Function to detect if the time is in 12-hour format
	function is12HourFormat(time) {
		return time.toLowerCase().includes('am') || time.toLowerCase().includes('pm');
	}

	// Create a date object from the time string
	function createDateObject(time) {
		const now = new Date();
		const [hours, minutes] = time.split(':');

		if (is12HourFormat(time)) {
			// 12-hour format
			const period = time.toLowerCase().includes('am') ? 'AM' : 'PM';
			return new Date(`${now.toDateString()} ${hours}:${minutes} ${period}`);
		} else {
			// 24-hour format
			return new Date(`${now.toDateString()} ${hours}:${minutes}`);
		}
	}

	// Convert the date object to a Unix timestamp
	const date = createDateObject(timeString);
	const unixTimestamp = Math.floor(date.getTime() / 1000);

	return unixTimestamp;
}
