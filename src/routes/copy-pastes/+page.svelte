<script>
	import { hasNitro, isMRBlack, isReply } from '$lib/stores.js';
	import { Toggle, Card } from 'flowbite-svelte';
	import Status from '$lib/copy-pastes/Status.svelte';
	import Greetings from '../../lib/copy-pastes/Greetings.svelte';
	import Favorites from '../../lib/copy-pastes/Favorites.svelte';

	$: console.log($hasNitro, $isReply);
</script>

<svelte:head>
	<title>Med-Tools: Copy Pastes</title>
	<meta property="og:title" content="Med-Tools" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`https://med-tools.space`} />
</svelte:head>

<div class="flex w-full justify-center">
	<div class="">
		<div class="mt-3 flex justify-center gap-7 md:w-full">
			<Card class="">
				<Favorites />
			</Card>
			<Card class="flex flex-col">
				<Toggle bind:checked={$hasNitro}>Add Discord Nitro Emotes</Toggle>
				<Toggle bind:checked={$isReply}>
					Add "/reply" to message (If sending messages via discord)
				</Toggle>
			</Card>
		</div>
		<Status />
		<Greetings />
	</div>
</div>
