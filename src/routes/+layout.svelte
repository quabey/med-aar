<script>
	import { settingsModal } from '$lib/stores.js';
	import Header from '$lib/Header.svelte';
	import '../app.css';
	import { Modal } from 'flowbite-svelte';
	import Settings from '$lib/Settings.svelte';
	import toast, { Toaster } from 'svelte-french-toast';
</script>

<html class="dark" lang="en">
	<div class="h-max min-h-screen w-full bg-gray-800">
		<Modal bind:open={$settingsModal} size="lg" title="Settings">
			<Settings />
		</Modal>
		<Header />
		<Toaster />

		<slot></slot>
	</div>
</html>

<style>
	* {
		color: white;
	}

	button:hover {
		background-color: rgb(44 82 120 / 90%) !important;
	}

	/* Hide the scrollbar tracks and buttons */
	::-webkit-scrollbar {
		width: 8px; /* Adjust width to your preference */
		height: 8px; /* Adjust height to your preference */
	}

	::-webkit-scrollbar-track {
		background: rgb(31 41 55);
	}

	::-webkit-scrollbar-thumb {
		background-color: white; /* Change to your desired color */
		border-radius: 10px; /* Adjust the roundness */
	}

	::-webkit-scrollbar-thumb:hover {
		@apply bg-slate-200; /* Color when hovering */
	}

	.focus-within\:ring-2:focus-within {
		box-shadow: none !important;
	}
</style>
