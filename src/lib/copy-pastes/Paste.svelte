<script>
	import { Card } from 'flowbite-svelte';
	import CopyIconButton from '$lib/copy-pastes/CopyIconButton.svelte';
	import FavoriteIconButton from '$lib/copy-pastes/FavoriteIconButton.svelte';
	export let paste;
</script>

<Card class="flex flex-row items-center justify-between">
	<span class="lowercase">{paste.name}</span>
	<div class="">
		<FavoriteIconButton {paste} />
		<CopyIconButton {paste} />
	</div>
</Card>
