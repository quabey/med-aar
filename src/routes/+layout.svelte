<script>
	import { settingsModal } from '$lib/stores.js';
	import Header from '$lib/Header.svelte';
	import '../app.css';
	import { Modal } from 'flowbite-svelte';
	import Settings from '$lib/Settings.svelte';
	import toast, { Toaster } from 'svelte-french-toast';
</script>

<svelte:head>
	<meta property="og:image" content={`https://med-tools.space/medtools-og.png`} />
	<meta
		property="og:description"
		content="med-tools.space is the premier unofficial resource hub for medrunners, offering essential tools for After Action Reports (AARs) and ship assignments. Explore top-notch utilities designed to enhance your medrunning experience."
	/>
</svelte:head>

<html class="dark" lang="en">
	<div class="h-max min-h-screen w-full bg-gray-800 font-Mohave font-medium">
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
