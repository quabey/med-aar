<script>
	import locationsData from '$lib/AAR/locations-new.json';
	import Fuse from 'fuse.js';

	let { onselect } = $props();

	let selectedBody = $state('');
	let searchInput = $state('');
	let results = $state([]);

	// Build flat list of selectable bodies (planets + moons) per system
	const systems = Object.entries(locationsData.systems).map(([sysKey, sys]) => {
		const bodies = [];
		for (const [planetKey, planet] of Object.entries(sys.planets)) {
			bodies.push({
				key: planetKey,
				name: planet.name,
				designation: planet.designation || '',
				parentPlanet: null,
				data: planet
			});
			for (const [moonKey, moon] of Object.entries(planet.moons || {})) {
				bodies.push({
					key: moonKey,
					name: moon.name,
					designation: moon.designation || '',
					parentPlanet: planet.name,
					data: moon
				});
			}
		}
		return { key: sysKey, name: sys.name, bodies };
	});

	const allBodies = systems.flatMap((s) => s.bodies);

	function classifyPoi(name) {
		if (/^(HDMS|HDMO|HDMF|HDPC|HDSF|HDRSO|HDOF)-/.test(name) || /^Security Post/.test(name))
			return 'Security / Bunker';
		if (/Mining|Ore\b|Mineral/.test(name)) return 'Mining';
		if (/Processing/.test(name)) return 'Processing';
		if (/Research/.test(name)) return 'Research';
		if (/Aid Shelter|Emergency Shelter/.test(name)) return 'Aid Shelter';
		if (/CommArray/.test(name)) return 'Comm Array';
		if (/Data.?Center/.test(name)) return 'Data Center';
		if (/Rehabilitation Facility|Prison/.test(name)) return 'Prison';
		if (/Farm|Hydro|Growery/.test(name)) return 'Farm';
		if (/Salvage/.test(name)) return 'Salvage';
		if (/Wreck|Derelict/.test(name)) return 'Wreck';
		return 'POI';
	}

	function getBodyLocations(body) {
		if (!body) return [];
		const d = body.data;
		const locs = [];
		(d.landingZones || []).forEach((n) => locs.push({ name: n, type: 'Landing Zone' }));
		(d.settlements || []).forEach((n) => locs.push({ name: n, type: 'Settlement' }));
		(d.stations || []).forEach((n) => locs.push({ name: n, type: 'Station' }));
		(d.lagrangeStations || []).forEach((n) => locs.push({ name: n, type: 'Lagrange Station' }));
		(d.pois || []).forEach((n) => locs.push({ name: n, type: classifyPoi(n) }));
		return locs;
	}

	const selectedBodyObj = $derived(allBodies.find((b) => b.key === selectedBody) ?? null);
	const bodyLocations = $derived(getBodyLocations(selectedBodyObj));

	const fuse = $derived(
		new Fuse(bodyLocations, {
			threshold: 0.4,
			includeScore: true,
			keys: ['name', 'type']
		})
	);

	function search() {
		if (!selectedBody) return;
		const q = searchInput.trim();
		if (!q) {
			results = bodyLocations.slice(0, 20).map((item) => ({ item }));
			return;
		}
		const found = fuse.search(q).slice(0, 15);
		const manualEntry = { item: { name: q, type: 'Manual entry' } };
		results = found.length === 0 ? [manualEntry] : [...found, manualEntry];
	}

	$effect(() => {
		// Reset search when body changes
		void selectedBody;
		searchInput = '';
		results = selectedBodyObj ? bodyLocations.slice(0, 20).map((item) => ({ item })) : [];
	});

	function handleKeydown(e) {
		if (e.key === 'Enter') search();
	}

	const typeColors = {
		'Landing Zone': 'bg-blue-500/20 text-blue-300',
		Settlement: 'bg-green-500/20 text-green-300',
		Station: 'bg-purple-500/20 text-purple-300',
		'Lagrange Station': 'bg-indigo-500/20 text-indigo-300',
		'Security / Bunker': 'bg-red-500/20 text-red-300',
		Mining: 'bg-yellow-500/20 text-yellow-300',
		Processing: 'bg-orange-500/20 text-orange-300',
		Research: 'bg-cyan-500/20 text-cyan-300',
		'Aid Shelter': 'bg-teal-500/20 text-teal-300',
		'Comm Array': 'bg-gray-500/20 text-gray-300',
		'Data Center': 'bg-violet-500/20 text-violet-300',
		Farm: 'bg-lime-500/20 text-lime-300',
		Salvage: 'bg-amber-500/20 text-amber-300',
		Wreck: 'bg-stone-500/20 text-stone-300',
		POI: 'bg-gray-500/20 text-gray-400',
		'Manual entry': 'bg-primary-500/20 text-primary-300'
	};

	function typeColor(type) {
		return typeColors[type] ?? 'bg-gray-500/20 text-gray-400';
	}
</script>

<div class="flex flex-col gap-2">
	<!-- Planet / body selector grouped by system -->
	<select
		bind:value={selectedBody}
		class="select w-full"
	>
		<option value="">Search locations...</option>
		{#each systems as sys}
			<optgroup label="{sys.name} System">
				{#each sys.bodies as body}
					<option value={body.key}>
						{body.name}{body.designation ? ' (' + body.designation + ')' : ''}{body.parentPlanet ? ' (' + body.parentPlanet + ')' : ''}
					</option>
				{/each}
			</optgroup>
		{/each}
	</select>

	{#if selectedBody}
		<!-- Search box -->
		<div class="flex gap-2">
			<input
				type="search"
				bind:value={searchInput}
				oninput={search}
				onkeydown={handleKeydown}
				class="input flex-1"
				placeholder="Search {selectedBodyObj?.name ?? ''} locations..."
			/>
		</div>

		<!-- Results -->
		{#if results.length > 0}
			<div class="max-h-64 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800/50">
				<table class="w-full text-sm">
					<thead class="sticky top-0 bg-gray-800">
						<tr class="border-b border-gray-700 text-left text-xs text-gray-400">
							<th class="px-3 py-2">Type</th>
							<th class="px-3 py-2">Name</th>
							<th class="px-3 py-2 text-right">Action</th>
						</tr>
					</thead>
					<tbody>
						{#each results as result}
							<tr class="border-b border-gray-700/50 transition-colors hover:bg-gray-700/50">
								<td class="px-3 py-2">
									<span class="rounded px-1.5 py-0.5 text-[10px] font-semibold {typeColor(result.item?.type)}">{result.item?.type}</span>
								</td>
								<td class="px-3 py-2 text-gray-200">{result.item?.name}</td>
								<td class="px-3 py-2 text-right">
									<button
										class="btn-sm btn-primary"
										onclick={() => onselect({ name: result.item?.name, planetaryBody: selectedBodyObj?.name ?? '', type: result.item?.type })}
									>
										Select
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>
