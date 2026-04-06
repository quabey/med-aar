<script>
	import logo from '$lib/assets/medtool-logo-beta-white.svg';
	import { supabase } from '$lib/supabaseClient.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { profile = null } = $props();
	let mobileOpen = $state(false);
	let userMenuOpen = $state(false);

	const isLoggedIn = $derived(!!profile);

	// Auth-required routes show a lock icon for guests
	const guestRoutes = ['/', '/dispatch-tool'];
	const allNavLinks = [
		{ href: '/', label: 'AAR Builder' },
		{ href: '/alerts', label: 'Alerts', authRequired: true },
		{ href: '/medrunner', label: 'Profiles', authRequired: true },
		{ href: '/dispatch-tool', label: 'Dispatch Tool' }
	];

	const navLinks = $derived(
		isLoggedIn
			? allNavLinks
			: allNavLinks.filter((l) => !l.authRequired)
	);

	function isActive(href) {
		const path = page.url.pathname;
		if (href === '/') return path === '/';
		return path === href || path.startsWith(href + '/');
	}

	async function logout() {
		await supabase.auth.signOut();
		goto('/login');
	}

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

<nav class="relative z-[60] border-b border-gray-800 bg-gray-900 px-4 shadow-lg">
	<div class="mx-auto flex items-center justify-between py-3">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2">
			<img src={logo} alt="Med-Tools Logo" class="h-8 w-8" />
			<span class="font-Mohave text-2xl font-bold text-white">MED-TOOLS</span>
			<span class="rounded-md bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400">
				UNOFFICIAL
			</span>
		</a>

		<!-- Desktop Nav -->
		<div class="hidden items-center gap-6 lg:flex">
			<ul class="flex items-center gap-1">
				{#each navLinks as link}
					<li>
						<a
							href={link.href}
							class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors {isActive(link.href)
								? 'bg-gray-800 text-white'
								: 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
						>
							{link.label}
							{#if link.badge}
								<span
									class="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-400"
								>
									{link.badge}
								</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>

			<div class="flex items-center gap-3 border-l border-gray-700 pl-4 text-sm">
				<a
					href="https://github.com/quabey/med-aar/"
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-400 transition-colors hover:text-white"
				>
					GitHub
				</a>
				<a href="/credits" class="text-gray-400 transition-colors hover:text-white">Credits</a>

				{#if profile}
					<!-- User menu -->
					<div class="relative">
						<button
							class="flex items-center gap-2 rounded-lg px-2 py-1 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
							onclick={() => (userMenuOpen = !userMenuOpen)}
						>
							{#if profile.discord_avatar}
								<img
									src={profile.discord_avatar}
									alt=""
									class="h-6 w-6 rounded-full"
								/>
							{:else}
								<div class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-600 text-xs font-bold">
									{profile.discord_username?.charAt(0) || '?'}
								</div>
							{/if}
							<span class="max-w-[100px] truncate text-sm">{profile.discord_username}</span>
							<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						{#if userMenuOpen}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="fixed inset-0 z-40" onclick={() => (userMenuOpen = false)}></div>
							<div class="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl">
								{#if profile.is_admin}
									<a
										href="/admin"
										class="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
										onclick={() => (userMenuOpen = false)}
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										Admin Panel
									</a>
								{/if}
								<button
									class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
									onclick={logout}
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
									</svg>
									Log Out
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<button
						class="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-500"
						onclick={loginWithDiscord}
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
						</svg>
						Log In
					</button>
				{/if}
			</div>
		</div>

		<!-- Mobile Menu Toggle -->
		<button class="rounded-lg p-2 text-gray-400 hover:bg-gray-800 lg:hidden" onclick={() => (mobileOpen = !mobileOpen)}>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if mobileOpen}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				{/if}
			</svg>
		</button>
	</div>

	<!-- Mobile Nav -->
	{#if mobileOpen}
		<div class="border-t border-gray-800 pb-4 pt-2 lg:hidden">
			{#each navLinks as link}
				<a
					href={link.href}
					class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm {isActive(link.href)
						? 'bg-gray-800 text-white'
						: 'text-gray-300 hover:bg-gray-800'}"
					onclick={() => (mobileOpen = false)}
				>
					{link.label}
					{#if link.badge}
						<span class="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400">{link.badge}</span>
					{/if}
				</a>
			{/each}
			<div class="mt-2 flex flex-col gap-1 border-t border-gray-800 px-3 pt-3">
				<a href="https://github.com/quabey/med-aar/" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-400 hover:text-white" onclick={() => (mobileOpen = false)}>GitHub</a>
				<a href="/credits" class="text-sm text-gray-400 hover:text-white" onclick={() => (mobileOpen = false)}>Credits</a>
				{#if profile?.is_admin}
					<a href="/admin" class="text-sm text-gray-400 hover:text-white" onclick={() => (mobileOpen = false)}>Admin</a>
				{/if}
				{#if profile}
					<button class="mt-1 text-left text-sm text-red-400 hover:text-red-300" onclick={logout}>Log Out</button>
				{:else}
					<button class="mt-1 text-left text-sm text-primary-400 hover:text-primary-300" onclick={loginWithDiscord}>Log In with Discord</button>
				{/if}
			</div>
		</div>
	{/if}
</nav>
