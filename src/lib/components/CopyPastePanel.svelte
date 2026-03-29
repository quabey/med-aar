<script>
	import { successToast } from '$lib/state/toast.svelte.js';

	const LS_FAVORITES = 'medtools:copyPasteFavorites';
	const LS_CUSTOM = 'medtools:copyPasteCustom';
	const LS_NAME = 'medtools:copyPasteName';

	const NAME_PLACEHOLDER = '[INSERT NAME HERE]';

	const defaultMessages = [
		{ id: 'status-sb', category: 'Status', label: 'Stand-By', text: ':SB1::SB2::SB3::SB4::SB5::SB6::SB7:' },
		{ id: 'status-aa', category: 'Status', label: 'On Alert', text: ':AA1::AA2::AA3::AA4::AA5::AA6::AA7::AA8:' },
		{ id: 'greet-before-questions', category: 'Greetings', label: 'Before questions answered', text: '**Thank you for choosing Medrunner Services!**\n\n Once the Questionnaire has been submitted we can proceed.' },
		{ id: 'greet-reminder-questionnaire', category: 'Greetings', label: 'Reminder to fill in the Questionnaire', text: 'Could you please fill in the Questionnaire?\n If you have already, be sure to press submit for I don\'t see them.' },
		{ id: 'greet-without-dispatch', category: 'Greetings', label: 'Without Dispatch', text: 'Hello! My name is **[INSERT NAME HERE]**, and I\'ll be leading the team dispatched to your location.\n\n I will be sending you a friend request and/or party invite.\n (To accept the invite, make sure you\'re in first-person view and spam the key to the right of `P` — typically the `[` key - though it may vary depending on your keyboard layout.)\n\n **Please confirm here when you are ready to receive the invites!**' },
		{ id: 'greet-no-teams', category: 'Greetings', label: 'No teams available', text: '**Thank you for choosing Medrunner Services!**\n\nWe\'ve received your alert — no need to worry. All active teams are currently deployed, but one will be assigned to you shortly.\n In the meantime, if you haven\'t already, please complete and submit the questionnaire.\n\n **Thank you for your patience!**' },
		{ id: 'greet-confirm-invites', category: 'Greetings', label: 'Confirmation for invites (if ignored)', text: 'Please let me know when you are ready to receive the invites!' },
		{ id: 'nocontact-warning', category: 'Without Contact', label: 'No Contact Warning', text: 'Just as fair warning, if we haven\'t heard from you within the next 5 minutes, we will hope all is well and close this alert.' },
		{ id: 'nocontact-standdown', category: 'Without Contact', label: 'No Contact standdown', text: 'Standing down due to no contact. You\'re welcome to resubmit, but please know that you will need to be ready to accept friend and party invites and answer the questions in order for us to respond.' },
		{ id: 'fr-check-key', category: 'Friend Request Bugged', label: 'Check their accept key', text: 'Hmm it was not accepted, is your default accept key the Left Bracket `[` ?' },
		{ id: 'fr-bugged-spectrum', category: 'Friend Request Bugged', label: 'Bugged, need Spectrum', text: 'The Friend Request has bugged, this is a known problem.\n Please can you navigate to https://robertsspaceindustries.com/spectrum to accept the Friend Request.\n\n Please confirm here once you have accepted it.' },
		{ id: 'invite-fr-sent', category: 'Invites & Joining', label: 'Friend Request sent', text: 'Friend Request sent, please spam the accept key!' },
		{ id: 'invite-party-sent', category: 'Invites & Joining', label: 'Party Invite sent', text: 'Party Invite sent, please spam the accept key!' },
		{ id: 'invite-joining-server', category: 'Invites & Joining', label: 'Joining server', text: 'Perfect! Our Team is joining your Server now. I will notify you when we are en route.' },
		{ id: 'invite-server-full', category: 'Invites & Joining', label: 'If server full', text: 'Perfect! Our Team is joining your Server now. I will notify you when we are en route.\n Do note your server is full, there may be a short delay. I apologize for this in advance.' },
		{ id: 'invite-joining-friends', category: 'Invites & Joining', label: 'Joining server then inviting friends', text: 'I will get your friend(s) in the party as well. Please provide me a moment to load into the server.' },
		{ id: 'deploy-confirm-friends', category: 'Deploying Comms', label: 'Confirming you can invite friends', text: 'I can now invite your friend(s) to the party. Please confirm here when they are ready to accept.' },
		{ id: 'deploy-no-markers', category: 'Deploying Comms', label: 'No Party markers', text: 'We sadly do not have your party marker.\n\n Could you please open up your console, type `r_displayinfo 2`, close the console, and send me a screenshot of your screen with the info at the top right visible?\n\n Upload it to https://imgur.com/upload and drop the link here.' },
		{ id: 'deploy-more-info', category: 'Deploying Comms', label: 'More information', text: '**To help ensure we provide an efficient service, please answer the following 2 questions:**\n\n 1) Will you be needing to use our Medical Bed?\n 2) Will you be needing an Extraction to the Closest Station?' },
		{ id: 'deploy-enroute', category: 'Deploying Comms', label: 'En Route', text: 'Our Team is en route. I will update you when we are shortly arriving.' },
		{ id: 'deploy-arriving', category: 'Deploying Comms', label: 'Shortly Arriving', text: 'Depending on the situation, we may not pick you up immediately. Please be patient while we secure the area.\n\n We will reach you soon. Switching over to in-game party chat now.\n *Note: If you are downed, it will be harder to read until you are revived.*' },
		{ id: 'close-success', category: 'Closing Comms', label: 'Success', text: '*As we conclude our service, we\'d like to sincerely thank you for trusting us. We hope today\'s response was prompt, professional, and met your expectations. Your health and satisfaction are our top priorities, and we hope to assist you again in the future if needed.*\n\n If you have a moment, we\'d greatly appreciate it if you could leave a rating and comment on the alert card to let us know how we did today!' },
		{ id: 'close-failure', category: 'Closing Comms', label: 'Failure', text: '*As we conclude our service, we\'d like to sincerely thank you for trusting us. We\'re sorry that we were unable to rescue you this time. Your health and satisfaction are our top priorities, and we hope that we will be able to assist you in the future if needed.*\n\n If you have a moment, we\'d greatly appreciate it if you could leave a rating and comment on the alert card to let us know how we handled your case today!' },
		{ id: 'close-other', category: 'Closing Comms', label: 'Non-Success/Non-Failure', text: '*As we conclude our service, we\'d like to sincerely thank you for trusting us. We\'re sorry that we were unable to rescue you this time. Your health and satisfaction are our top priorities, and we hope that we will be able to assist you in the future if needed.*\n\n Until then, we wish you safe travels in the \'Verse.' }
	];

	function loadFavorites() {
		if (typeof window === 'undefined') return new Set();
		try {
			return new Set(JSON.parse(localStorage.getItem(LS_FAVORITES) || '[]'));
		} catch {
			return new Set();
		}
	}

	function loadCustom() {
		if (typeof window === 'undefined') return [];
		try {
			return JSON.parse(localStorage.getItem(LS_CUSTOM) || '[]');
		} catch {
			return [];
		}
	}

	let favorites = $state(loadFavorites());
	let customMessages = $state(loadCustom());
	let showAdd = $state(false);
	let showSettings = $state(false);
	let newLabel = $state('');
	let newText = $state('');
	let newCategory = $state('Custom');
	let collapsed = $state(false);
	let userName = $state(typeof window !== 'undefined' ? (localStorage.getItem(LS_NAME) || '') : '');

	function needsName(text) {
		return text.includes(NAME_PLACEHOLDER);
	}

	function saveName() {
		localStorage.setItem(LS_NAME, userName);
	}

	function saveFavorites() {
		localStorage.setItem(LS_FAVORITES, JSON.stringify([...favorites]));
	}

	function saveCustom() {
		localStorage.setItem(LS_CUSTOM, JSON.stringify(customMessages));
	}

	function toggleFavorite(id) {
		if (favorites.has(id)) {
			favorites.delete(id);
		} else {
			favorites.add(id);
		}
		favorites = new Set(favorites);
		saveFavorites();
	}

	function copyMessage(text, category) {
		let finalText = text;
		if (userName) {
			finalText = finalText.replaceAll(NAME_PLACEHOLDER, userName);
		}
		if (category === 'Status') {
			const ts = Math.floor(Date.now() / 1000);
			finalText = `${text} <t:${ts}:R>`;
		}
		navigator.clipboard.writeText(finalText).then(() => successToast('Copied!'));
	}

	function addCustom() {
		if (!newLabel.trim() || !newText.trim()) return;
		const msg = {
			id: 'custom-' + Date.now(),
			category: newCategory.trim() || 'Custom',
			label: newLabel.trim(),
			text: newText.trim()
		};
		customMessages = [...customMessages, msg];
		saveCustom();
		newLabel = '';
		newText = '';
		newCategory = 'Custom';
		showAdd = false;
		successToast('Message added');
	}

	function deleteCustom(id) {
		customMessages = customMessages.filter((m) => m.id !== id);
		favorites.delete(id);
		favorites = new Set(favorites);
		saveCustom();
		saveFavorites();
	}

	const allMessages = $derived([...defaultMessages, ...customMessages]);

	const favoritedMessages = $derived(allMessages.filter((m) => favorites.has(m.id)));

	const sortedMessages = $derived(
		[...allMessages].sort((a, b) => {
			const aFav = favorites.has(a.id) ? 0 : 1;
			const bFav = favorites.has(b.id) ? 0 : 1;
			return aFav - bFav;
		})
	);

	const categories = $derived([...new Set(allMessages.map((m) => m.category))]);
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b border-gray-700 px-3 py-2">
		<h3 class="font-Mohave text-sm font-semibold uppercase tracking-wider text-gray-300">
			Copy Pastes
		</h3>
		<div class="flex items-center gap-1">
			<button
				class="btn-sm btn-primary text-xs"
				onclick={() => (showAdd = !showAdd)}
				title="Add message"
			>
				+ New
			</button>
			<button
				class="rounded p-1 text-gray-400 transition-colors hover:text-white"
				onclick={() => (showSettings = !showSettings)}
				title="Settings"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</button>
			<button
				class="rounded p-1 text-gray-400 transition-colors hover:text-white"
				onclick={() => (collapsed = !collapsed)}
				title={collapsed ? 'Expand' : 'Collapse'}
			>
				<svg class="h-4 w-4 transition-transform {collapsed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
				</svg>
			</button>
		</div>
	</div>

	{#if !collapsed}
		<!-- Settings panel -->
		{#if showSettings}
			<div class="border-b border-gray-700 bg-gray-800/60 p-3 flex flex-col gap-2">
				<p class="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Settings</p>
				<div class="flex flex-col gap-1">
					<label for="cp-name" class="text-xs text-gray-400">Your name (replaces [INSERT NAME HERE])</label>
					<input
						id="cp-name"
						type="text"
						class="input text-xs"
						placeholder="Enter your name..."
						bind:value={userName}
						oninput={saveName}
					/>
				</div>
				<button class="btn-sm btn-outline text-xs self-end" onclick={() => (showSettings = false)}>Close</button>
			</div>
		{/if}

		<!-- Add new message form -->
		{#if showAdd}
			<div class="border-b border-gray-700 bg-gray-800/60 p-3 flex flex-col gap-2">
				<input
					type="text"
					class="input text-xs"
					placeholder="Category (e.g. Mission)"
					bind:value={newCategory}
				/>
				<input
					type="text"
					class="input text-xs"
					placeholder="Label"
					bind:value={newLabel}
				/>
				<textarea
					class="textarea min-h-[60px] text-xs"
					placeholder="Message text..."
					bind:value={newText}
				></textarea>
				<div class="flex gap-2">
					<button class="btn-sm btn-primary flex-1 text-xs" onclick={addCustom}>Save</button>
					<button class="btn-sm btn-outline flex-1 text-xs" onclick={() => (showAdd = false)}>Cancel</button>
				</div>
			</div>
		{/if}

		<!-- Messages: favorites section at top, then by category -->
		<div class="flex-1 overflow-y-auto p-2 pb-16">
			{#if favoritedMessages.length > 0}
				<div class="mb-3">
					<p class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-yellow-500/70">⭐ Favorites</p>
					{#each favoritedMessages as msg}
						<div class="mb-1 flex items-center gap-1 rounded bg-gray-700/40 px-2 py-1.5">
							<button
								class="flex-shrink-0 text-base leading-none transition-colors text-yellow-400"
								onclick={() => toggleFavorite(msg.id)}
								title="Unfavorite"
							>★</button>
							<span class="flex-1 min-w-0 text-xs text-gray-200 truncate" title={msg.text}>{msg.label}</span>
							{#if needsName(msg.text) && !userName}
								<span class="relative group flex-shrink-0">
									<button
										class="btn-sm text-[10px] bg-gray-600 text-gray-400 cursor-not-allowed"
										disabled
									>Copy</button>
									<span class="pointer-events-none absolute bottom-full right-0 mb-1 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-gray-300 shadow-lg group-hover:block">Set your name in settings</span>
								</span>
							{:else}
								<button
									class="btn-sm btn-primary text-[10px] flex-shrink-0"
									onclick={() => copyMessage(msg.text, msg.category)}
								>Copy</button>
							{/if}
						</div>
					{/each}
				</div>
				<div class="mx-1 mb-3 h-px bg-gray-700"></div>
			{/if}
			{#each categories as category}
				<div class="mb-3">
					<p class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">{category}</p>
					{#each allMessages.filter((m) => m.category === category) as msg}
						<div class="mb-1 flex items-center gap-1 rounded bg-gray-700/40 px-2 py-1.5">
							<button
								class="flex-shrink-0 text-base leading-none transition-colors {favorites.has(msg.id) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}"
								onclick={() => toggleFavorite(msg.id)}
								title={favorites.has(msg.id) ? 'Unfavorite' : 'Favorite'}
							>★</button>
							<span class="flex-1 min-w-0 text-xs text-gray-200 truncate" title={msg.text}>{msg.label}</span>
							{#if needsName(msg.text) && !userName}
								<span class="relative group flex-shrink-0">
									<button
										class="btn-sm text-[10px] bg-gray-600 text-gray-400 cursor-not-allowed"
										disabled
									>Copy</button>
									<span class="pointer-events-none absolute bottom-full right-0 mb-1 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-[10px] text-gray-300 shadow-lg group-hover:block">Set your name in settings</span>
								</span>
							{:else}
								<button
									class="btn-sm btn-primary text-[10px] flex-shrink-0"
									onclick={() => copyMessage(msg.text, msg.category)}
								>Copy</button>
							{/if}
							{#if msg.id.startsWith('custom-')}
								<button
									class="flex-shrink-0 rounded p-0.5 text-gray-600 transition-colors hover:text-red-400"
									onclick={() => deleteCustom(msg.id)}
									title="Delete"
								>
									<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>
