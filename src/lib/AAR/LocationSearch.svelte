<script>
	import {
		Search,
		Button,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	// import the locations from locations.json
	import locations from '$lib/AAR/locations.json';
	import Fuse from 'fuse.js';

	const fuseOptions = {
		threshold: 0.35,
		includeScore: true,
		keys: ['name', 'type']
	};

	const fuse = new Fuse(locations, fuseOptions);

	export let location;
	let results = [];

	$: searchLocation(), searchInput;

	function searchLocation() {
		let sanitizedInput = searchInput.trim();
		searchInput = sanitizedInput.replace(/[^a-zA-Z0-9 ]/g, '');

		if (!searchInput) {
			return;
		}
		results = fuse.search(searchInput);
		if (results.length === 0) {
			results = [{ name: searchInput, type: '' }];
		}
		// cut array to 10 results and add the input as the last result
		results = results.slice(0, 10);
		results[results[0].item ? results.length : 0] = {
			item: { name: searchInput, type: 'Manual' }
		};
	}

	let searchInput = '';
</script>

<div class="flex flex-col gap-2">
	<Search bind:value={searchInput}>
		<Button class="mr-2" on:click={searchLocation}>Search</Button>
	</Search>
	{#if results.length}
		<Table shadow>
			<TableHead>
				<TableHeadCell>Name</TableHeadCell>
				<TableHeadCell>Type</TableHeadCell>
				<TableHeadCell>Actions</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each results as result}
					<TableBodyRow>
						<TableBodyCell>{result.item.name ?? ''}</TableBodyCell>
						<TableBodyCell>{result.item.type}</TableBodyCell>
						<TableBodyCell>
							<Button on:click={() => (location = result.item.name)}>Select</Button>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
</div>
