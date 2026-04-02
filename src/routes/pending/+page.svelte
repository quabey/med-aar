<script>
	import { supabase } from '$lib/supabaseClient.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let checking = $state(false);

	async function logout() {
		await supabase.auth.signOut();
		goto('/login');
	}

	async function checkStatus() {
		checking = true;
		try {
			const { data } = await supabase
				.from('profiles')
				.select('is_approved')
				.single();
			if (data?.is_approved) {
				goto('/');
				return;
			}
		} catch {
			// ignore errors, just stay on pending
		}
		checking = false;
	}

	// Poll every 10 seconds for approval
	onMount(() => {
		const interval = setInterval(checkStatus, 10000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Pending Approval — Med-Tools</title>
</svelte:head>

<div class="flex flex-1 items-center justify-center">
	<div class="mx-4 w-full max-w-md rounded-2xl border border-gray-700 bg-gray-800 p-8 text-center shadow-xl">
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
			<svg class="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</div>

		<h1 class="font-Mohave text-2xl font-bold text-white">Pending Approval</h1>
		<p class="mt-3 text-sm text-gray-400">
			Your account is awaiting approval from an admin. You'll be able to access Med-Tools once your account has been approved.
		</p>

		<div class="mt-6 flex justify-center gap-3">
			<button
				onclick={checkStatus}
				disabled={checking}
				class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
			>
				{checking ? 'Checking...' : 'Check Status'}
			</button>
			<button
				onclick={logout}
				class="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-700"
			>
				Log Out
			</button>
		</div>
	</div>
</div>
