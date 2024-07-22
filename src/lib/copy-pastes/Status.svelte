<script>
	import Section from '$lib/copy-pastes/Section.svelte';
	import status from '$lib/copy-pastes/pastes/statusPastes.json';
	import Paste from '$lib/copy-pastes/Paste.svelte';
</script>

<Section sectionName="Status">
	<div class="flex flex-row gap-3">
		{#each status as paste}
			<Paste {paste} />
		{/each}
	</div>
</Section>
