<script>
	import logo from '$lib/assets/medtool-logo-beta-white.svg';

	let mobileOpen = $state(false);

	const navLinks = [
		{ href: '/', label: 'AAR Builder' },
		{ href: '/dispatch-tool', label: 'Dispatch Tool' },
		{ href: '/copy-pastes', label: 'Copy-Pastes', badge: 'WIP' }
	];
</script>

<nav class="border-b border-gray-800 bg-gray-900 px-4 shadow-lg">
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
							class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
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
				<a
					href="/admin"
					class="text-gray-400 transition-colors hover:text-white"
					title="Admin Panel"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</a>
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
					class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
					onclick={() => (mobileOpen = false)}
				>
					{link.label}
					{#if link.badge}
						<span class="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400">{link.badge}</span>
					{/if}
				</a>
			{/each}
			<div class="mt-2 flex gap-3 border-t border-gray-800 px-3 pt-3">
				<a href="https://github.com/quabey/med-aar/" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-400 hover:text-white">GitHub</a>
				<a href="/credits" class="text-sm text-gray-400 hover:text-white">Credits</a>
				<a href="/admin" class="text-sm text-gray-400 hover:text-white">Admin</a>
			</div>
		</div>
	{/if}
</nav>
