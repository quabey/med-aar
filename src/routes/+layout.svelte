<script>
	import '../app.css';
	import toast, { Toaster } from 'svelte-french-toast';
</script>

<html class="dark" lang="en">
	<div class="h-full w-full bg-gray-800">
		<Toaster />

		<slot></slot>

		<div class="bottom-banner">Made with ❤️ by bey</div>
	</div>
</html>

<style>
	.bottom-banner {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		overflow: hidden;
		background-color: #f87171;
		padding-left: 0.5rem;
		font-weight: 900;
		box-sizing: border-box;
	}

	* {
		color: white;
	}
</style>
