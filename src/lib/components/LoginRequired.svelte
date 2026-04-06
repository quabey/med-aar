<script>
	import Modal from './Modal.svelte';
	import { supabase } from '$lib/supabaseClient.js';

	let { show = $bindable(false), message = 'You need to log in to use this feature.' } = $props();

	async function loginWithDiscord() {
		await supabase.auth.signInWithOAuth({
			provider: 'discord',
			options: {
				scopes: 'identify email guilds.members.read',
				redirectTo: `${window.location.origin}/auth/callback`
			}
		});
	}
</script>

{#if show}
	<Modal title="Login Required" onclose={() => (show = false)} size="sm">
		<div class="p-4 text-center">
			<svg class="mx-auto mb-4 h-12 w-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
			</svg>
			<p class="mb-6 text-gray-300">{message}</p>
			<div class="flex justify-center gap-3">
				<button class="btn btn-primary flex items-center gap-2" onclick={loginWithDiscord}>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
						<path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
					</svg>
					Log in with Discord
				</button>
				<button class="btn btn-secondary" onclick={() => (show = false)}>
					Cancel
				</button>
			</div>
		</div>
	</Modal>
{/if}
