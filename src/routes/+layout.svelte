<script>
	import Header from '$lib/Header.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { alertStore } from '$lib/state/alerts.svelte.js';
	import { config } from '$lib/config/index.svelte.js';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient.js';
	import { invalidateAll } from '$app/navigation';
	import '../app.css';

	let { data, children } = $props();

	const isLoggedIn = $derived(!!data.session && data.profile?.is_approved);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(() => {
			invalidateAll();
		});

		return () => subscription.unsubscribe();
	});

	$effect(() => {
		if (isLoggedIn) {
			alertStore.initialize();
			config.initialize();
		}
	});
</script>

<svelte:head>
	<meta property="og:image" content={`https://med-tools.space/medtools-og.png`} />
	<meta
		property="og:description"
		content="med-tools.space is the premier unofficial resource hub for medrunners, offering essential tools for After Action Reports (AARs) and ship assignments."
	/>
</svelte:head>

<div class="flex h-screen flex-col overflow-hidden bg-gray-900 font-Mohave font-medium text-white">
	{#if isLoggedIn}
		<Header profile={data.profile} />
	{/if}
	<main class="relative flex min-h-0 flex-1 flex-col">
		{@render children()}
	</main>
	<Toast />
</div>

<style>
	:global(::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}

	:global(::-webkit-scrollbar-track) {
		background: rgb(17 24 39);
	}

	:global(::-webkit-scrollbar-thumb) {
		background-color: rgb(75 85 99);
		border-radius: 10px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background-color: rgb(107 114 128);
	}
</style>
