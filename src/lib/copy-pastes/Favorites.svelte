<script>
	import { favorites } from '$lib/stores.js';
	import { Table, TableBody, TableBodyRow, TableBodyCell } from 'flowbite-svelte';
	import FavoriteIconButton from '$lib/copy-pastes/FavoriteIconButton.svelte';
	import CopyIconButton from '$lib/copy-pastes/CopyIconButton.svelte';
</script>

<Table class="">
	<TableBody>
		{#each $favorites as paste}
			<TableBodyRow>
				<TableBodyCell class="p-1">
					<div class="flex flex-row items-center justify-between">
						{paste.name}
						<div class="">
							<FavoriteIconButton {paste} />
							<CopyIconButton {paste} />
						</div>
					</div>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
