import { successToast, errorToast } from '$lib/state/toast.svelte.js';

export function copy(message) {
	try {
		navigator.clipboard.writeText(message);
		successToast('Message copied');
	} catch (error) {
		errorToast('Error copying message, try view the message instead');
	}
}
