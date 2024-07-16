<script>
	import { settingsModal } from '$lib/stores.js';
	import logo from '$lib/assets/medtool-logo-beta-white.svg';
	import { ChevronDownOutline, CogOutline } from 'flowbite-svelte-icons';
	import { Badge } from 'flowbite-svelte';
</script>

<!-- Yes I litteraly just copied the HTML code from the MR website, sue me -->
<div class="">
	<nav class="bg-white px-5 shadow-md dark:bg-gray-800 dark:shadow-gray-900">
		<div class="mx-auto font-medium">
			<div
				class="content-container flex hidden flex-wrap items-center justify-between py-3 lg:flex"
			>
				<div class=" flex flex-row items-center gap-2">
					<img src={logo} alt="Med-Tools Logo" class="h-10 w-10" />
					<span class="font-Mohave text-3xl font-bold">MED-TOOLS</span>
					<Badge color="red" large>Unofficial</Badge>
					<Badge color="red" large>Beta v0.4.2</Badge>
				</div>
				<ul class="flex gap-10">
					<li>
						<a href="/" class="router-link-active router-link-exact-active" aria-current="page">
							Home
						</a>
					</li>
					<li>
						<div class="relative">
							<a
								href="/assignments"
								class="flex w-full items-center justify-between gap-2 rounded py-2 pl-3 pr-4 lg:w-auto lg:border-0 lg:p-0 lg:hover:bg-transparent lg:dark:hover:bg-transparent"
							>
								Ship Assignments
								<Badge color="green">New!</Badge>
							</a>
						</div>
					</li>
					<li>
						<div class="relative">
							<a
								href="/copy-pastes"
								class="flex w-full items-center justify-between gap-2 rounded py-2 pl-3 pr-4 lg:w-auto lg:border-0 lg:p-0 lg:hover:bg-transparent lg:dark:hover:bg-transparent"
							>
								Copy-Pastes
								<Badge color="yellow">WIP</Badge>
							</a><!---->
						</div>
					</li>
				</ul>
				<div class="flex items-center gap-4 text-primary-300">
					<a href="https://github.com/quabey/med-aar/" target="_blank"><span>Github</span></a>
					<a href="/credits">
						<span class=" border-x-2 border-white px-4"> Credits </span>
					</a>
					<button on:click={() => ($settingsModal = true)}>
						<CogOutline class="h-6 w-6 text-white dark:text-white" />
					</button>
				</div>

				<!---->
			</div>
		</div>
	</nav>
	<!---->
</div>
