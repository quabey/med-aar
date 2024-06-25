<script>
	import Header from '$lib/Header.svelte';
	import '../app.css';
	import toast, { Toaster } from 'svelte-french-toast';
</script>

<html class="dark" lang="en">
	<div class="h-full w-full bg-gray-800">
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
</style>
