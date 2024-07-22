<script>
	import Section from '$lib/copy-pastes/section.svelte';
	import greetings from '$lib/copy-pastes/greetingsPastes.json';
	import Paste from '$lib/copy-pastes/Paste.svelte';
</script>

<Section sectionName="Greetings">
	<div class="flex flex-row gap-3">
		{#each greetings as paste}
			<Paste {paste} />
		{/each}
	</div>
</Section>
