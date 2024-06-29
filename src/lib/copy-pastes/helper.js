import { toast } from 'svelte-french-toast';

export function copy(message) {
	try {
		navigator.clipboard.writeText(message);
		toast.success('Message copied', {
			style: 'background-color: #2c5278; color: white;',
			position: 'top-right'
		});
	} catch (error) {
		toast.error('Error copying message, try view the message instead', {
			style: 'background-color: #2c5278; color: white;',
			position: 'top-right'
		});
	}
}
