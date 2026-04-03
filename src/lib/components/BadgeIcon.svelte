<script>
	/** @type {{ id: string, tier?: number, class?: string }} */
	let { id, tier = 1, class: cls = 'h-5 w-5' } = $props();

	const paths = {
		rookie:        'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
		experienced:   'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
		veteran:       'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z',
		elite:         'M3.85 8.62a4 4 0 014.78-4.77 4 4 0 016.74 0 4 4 0 014.78 4.77 4 4 0 010 6.76 4 4 0 01-4.78 4.77 4 4 0 01-6.74 0 4 4 0 01-4.78-4.77 4 4 0 010-6.76z',
		legendary:     'M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7m12-3a2.5 2.5 0 000 5H18s0-3-1.5-5M8 2h8m-4 0v4m-4 6V9h8v3m-8 0a4 4 0 004 4h0a4 4 0 004-4m-4 4v4',
		mythic:        'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
		transcendent:  'M12 2l2.5 6.5H22l-5.5 4 2.5 6.5L12 15l-7 4 2.5-6.5L2 8.5h7.5L12 2zM12 6v6',
		immortal:      'M12 2a10 10 0 100 20 10 10 0 000-20zM12 6a6 6 0 110 12 6 6 0 010-12zM12 9a3 3 0 100 6 3 3 0 000-6z',
		flawless:      'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
		perfect:       'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
		reliable:      'M9 12l2 2 4-4m6 2a10 10 0 11-20 0 10 10 0 0120 0z',
		lightning:     'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
		fast_responder:'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
		specialist:    'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83',
		expert:        'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83',
		master:        'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83',
		dispatcher:    'M22 12h-4l-3 9L9 3l-3 9H2',
		dispatch_expert:'M22 12h-4l-3 9L9 3l-3 9H2',
		dispatch_master:'M22 12h-4l-3 9L9 3l-3 9H2',
		field_ops:     'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3M22 2l-5 5m-4.64 4.36a3.5 3.5 0 00-4.95 0L5 14l5 5 2.64-2.41a3.5 3.5 0 000-4.95z',
		field_expert:  'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3M22 2l-5 5m-4.64 4.36a3.5 3.5 0 00-4.95 0L5 14l5 5 2.64-2.41a3.5 3.5 0 000-4.95z',
		field_master:  'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3M22 2l-5 5m-4.64 4.36a3.5 3.5 0 00-4.95 0L5 14l5 5 2.64-2.41a3.5 3.5 0 000-4.95z',
		versatile:     'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
		polymath:      'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
		committed:     'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
		dedicated:     'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
		tireless:      'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
		lifelong:      'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
	};

	const tierColors = {
		1: 'text-gray-400',
		2: 'text-blue-400',
		3: 'text-purple-400',
		4: 'text-amber-400',
		5: 'text-amber-400',
		6: 'text-red-400',
		7: 'text-rose-300',
		8: 'text-white',
	};

	const color = $derived(tierColors[tier] || 'text-gray-400');
	const d = $derived(paths[id] || 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v4m0 4h.01');
</script>

<svg class="{cls} {color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
	{#each d.split(/(?<=[zZ])(?=M)/) as segment}
		<path d={segment} />
	{/each}
</svg>
