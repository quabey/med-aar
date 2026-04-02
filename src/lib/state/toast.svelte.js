let toasts = $state([]);
let nextId = 0;

export function addToast(message, type = 'success', duration = 3000) {
	const id = nextId++;
	toasts.push({ id, message, type, duration });
	setTimeout(() => removeToast(id), duration);
}

export function removeToast(id) {
	const idx = toasts.findIndex((t) => t.id === id);
	if (idx !== -1) toasts.splice(idx, 1);
}

export function successToast(message) {
	addToast(message, 'success');
}

export function errorToast(message) {
	addToast(message, 'error', 4000);
}

export function getToasts() {
	return toasts;
}
