import { toast } from 'svelte-french-toast';

export function successToast(message) {
	toast.success(message, {
		duration: 3000,
		position: 'top-right',
		showIcon: true
	});
}

export function errorToast(message) {
	toast.error(message, {
		duration: 3000,
		position: 'top-right',
		showIcon: true
	});
}
