<script>
	import { Select, Input } from 'flowbite-svelte';
	import { alertType, alertTypeOther } from '$lib/stores.js';

	const alertTypes = [
		{ name: 'Bunker', value: 'Bunker' },
		{ name: 'Pickup', value: 'Pickup' },
		{ name: 'SPK', value: 'SPK' },
		{ name: 'Stranded in Space', value: 'Stranded in Space' },
		{ name: 'Stranded on Planet', value: 'Stranded on Planet' },
		{ name: 'Destribution Center', value: 'Destribution Center' },
		{ name: 'Space PVE', value: 'Space PVE' },
		{ name: 'Space PVP', value: 'Space PVP' },
		{ name: 'Planet PVE', value: 'Planet PVE' },
		{ name: 'Planet PVP', value: 'Planet PVP' },
		{ name: 'Jumptown', value: 'Jumptown' },
		{ name: 'Ghost Hollow', value: 'Ghost Hollow' },
		{ name: 'Other', value: 'Other' }
	];
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-row items-center justify-between">
		<span>Alert Type:</span>
		<div class="flex flex-row items-center justify-center gap-2">
			<Select class="w-[12rem]" items={alertTypes} bind:value={$alertType} />
			{#if $alertType == 'Other'}
				<Input
					bind:value={$alertTypeOther}
					type="text"
					class="my-2 rounded-xl border-2 border-black"
					placeholder="Enter Alert Type..."
				/>
			{/if}
		</div>
	</div>
</div>
