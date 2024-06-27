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
	import MiniSearch from 'minisearch';

	export let location;
	let results = [];

	let minisearch = new MiniSearch({
		fields: ['name', 'type'],
		storeFields: ['name', 'type']
	});

	minisearch.addAll(locations);

	function searchLocation() {
		console.log('searching for ' + searchInput);
		results = minisearch.search(searchInput);
		if (results.length === 0) {
			results = [{ name: searchInput, type: '' }];
		}
		console.log(results);
	}

	let searchInput = '';
</script>

<div class="flex flex-col gap-2">
	<Search bind:value={searchInput}>
		<Button class="mr-2" on:click={searchLocation}>Search</Button>
	</Search>
	<Table shadow>
		<TableHead>
			<TableHeadCell>Name</TableHeadCell>
			<TableHeadCell>Type</TableHeadCell>
			<TableHeadCell>Actions</TableHeadCell>
		</TableHead>
		<TableBody>
			{#each results as result}
				<TableBodyRow>
					<TableBodyCell>{result.name}</TableBodyCell>
					<TableBodyCell>{result.type}</TableBodyCell>
					<TableBodyCell>
						<Button on:click={() => (location = result.name)}>Select</Button>
					</TableBodyCell>
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
</div>
