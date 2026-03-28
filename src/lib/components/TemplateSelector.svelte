<script>
	import { slide } from 'svelte/transition';
	import { config } from '$lib/config/index.svelte.js';
	import { alertStore } from '$lib/state/alerts.svelte.js';

	let { onselect } = $props();

	let selectedTemplate = $state(null);
	let customName = $state('');

	function pickTemplate(id) {
		selectedTemplate = id;
	}

	function selectWithAlert(alert) {
		if (!selectedTemplate) return;
		const label = alertStore.getAlertLabel(alert);
		onselect(selectedTemplate, label);
	}

	function selectWithCustomName() {
		if (!selectedTemplate) return;
		onselect(selectedTemplate, customName.trim() || null);
	}
</script>

<div class="flex justify-center p-8 {selectedTemplate ? 'pt-4' : 'min-h-[60vh] items-center'}">
	<div class="w-full max-w-3xl">
		<div class="mb-6 text-center">
			<h2 class="mb-1 font-Mohave text-3xl font-bold text-white">New AAR</h2>
			<p class="text-gray-400">{selectedTemplate ? 'Name your AAR or pick a recent alert' : 'Choose a template to get started'}</p>
		</div>

		<!-- Template grid (always visible) -->
		<div class="grid gap-3 sm:grid-cols-3">
			{#each Object.entries(config.templates) as [id, template]}
				<button
					class="group rounded-xl border p-4 text-left transition-all {selectedTemplate === id
						? 'border-primary-400 bg-primary-500/10 shadow-lg shadow-primary-400/10'
						: 'border-gray-700 bg-gray-800 hover:border-primary-400 hover:bg-gray-700/80 hover:shadow-lg hover:shadow-primary-400/10'}"
					onclick={() => pickTemplate(id)}
				>
					<div class="flex items-center gap-3">
						<span class="text-2xl">{template.icon}</span>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<h3
									class="font-Mohave text-base font-semibold transition-colors {selectedTemplate === id ? 'text-primary-300' : 'text-white group-hover:text-primary-300'}"
								>
									{template.name}
								</h3>
								{#if template.recommended}
									<span class="rounded bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary-300">Recommended</span>
								{/if}
							</div>
							<p class="text-xs text-gray-400">{template.sections.length} section{template.sections.length !== 1 ? 's' : ''}</p>
						</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Name / alert section (appears below when template is selected) -->
		{#if selectedTemplate}
			<div class="mt-6 rounded-xl border border-gray-700 bg-gray-800/50 p-4" transition:slide={{ duration: 250 }}>
				<div class="flex items-center gap-2">
					<input
						type="text"
						class="input flex-1"
						placeholder="AAR name (optional)..."
						bind:value={customName}
						onkeydown={(e) => e.key === 'Enter' && selectWithCustomName()}
					/>
					<button class="btn btn-primary" onclick={selectWithCustomName}>
						{customName.trim() ? 'Create' : 'Skip'}
					</button>
				</div>

				{#if alertStore.recentAlerts.length > 0}
					<div class="h-px bg-gray-700 my-3"></div>
					<h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Recent Alerts</h3>
					<div class="max-h-60 overflow-y-auto space-y-1.5">
						{#each alertStore.recentAlerts as alert}
							<button
								class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-left transition-all hover:border-primary-400 hover:bg-gray-700/80"
								onclick={() => selectWithAlert(alert)}
							>
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-200">
										{alertStore.getAlertLabel(alert)}
									</span>
									<span class="text-xs text-gray-500">
										{new Date(alert.creationTimestamp * 1000).toLocaleString()}
									</span>
								</div>
								<p class="mt-0.5 text-xs text-gray-400">
									{alert.clientRsiHandle}{[alert.system, alert.subsystem].filter(Boolean).length > 0 ? ' — ' + [alert.system, alert.subsystem].filter(Boolean).join(' / ') : ''}
								</p>
							</button>
						{/each}
					</div>
				{:else}
					<p class="text-center text-xs text-gray-500 mt-3">
						No recent alerts.
						{#if alertStore.connected}
							<span class="text-green-400">WebSocket connected.</span>
						{:else if alertStore.connectionError}
							<span class="text-red-400" title={alertStore.connectionError}>WebSocket error.</span>
						{:else}
							<span class="text-yellow-400">WebSocket connecting...</span>
						{/if}
					</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
