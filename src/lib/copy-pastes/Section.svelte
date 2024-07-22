<script>
	import { Card } from 'flowbite-svelte';

	export let sectionName;
</script>

<Card class="m-2 w-full max-w-7xl sm:p-4 md:w-[50rem]">
	<div class="">
		<div class="mb-2 flex flex-row items-center justify-start">
			<span class="font-Mohave text-2xl font-semibold uppercase dark:text-white">
				{sectionName}
			</span>
		</div>
	</div>
	<slot><!-- optional fallback --></slot>
</Card>
