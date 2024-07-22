<script>
	import { favorites } from '$lib/stores.js';
	import { HeartSolid, HeartOutline } from 'flowbite-svelte-icons';

	export let paste;

	function toggleFavorite() {
		if ($favorites.includes(paste)) {
			$favorites = $favorites.filter((favorite) => favorite !== paste);
		} else {
			$favorites = [...$favorites, paste];
		}
	}
</script>

<button on:click={toggleFavorite} class="hover:scale-110">
	{#if $favorites.includes(paste)}
		<button><HeartSolid class="h-6 w-6 text-white" /></button>
	{:else}
		<HeartOutline class="h-6 w-6 text-white" />
	{/if}
</button>
