<script>
	import '../app.css';
	import toast, { Toaster } from 'svelte-french-toast';
</script>

<html class="dark" lang="en">
	<div class="h-full w-full bg-gray-800">
		<Toaster />

		<slot></slot>
	</div>
</html>

<style>
	* {
		color: white;
	}
</style>
