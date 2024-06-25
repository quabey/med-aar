<script>
	import logo from '$lib/assets/med-tools-logo-beta-white.svg';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
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
					<span class="font-Mohave text-3xl font-bold">MED-TOOLS</span>
					<Badge color="red" large>Unofficaial</Badge>
				</div>
				<ul class="flex gap-10">
					<li>
						<a href="/" class="router-link-active router-link-exact-active" aria-current="page">
							Home
						</a>
					</li>
					<li>
						<div class="relative">
							<button
								class="flex w-full items-center justify-between rounded py-2 pl-3 pr-4 lg:w-auto lg:border-0 lg:p-0 lg:hover:bg-transparent lg:dark:hover:bg-transparent"
							>
								Ship Assignments
							</button><!---->
						</div>
					</li>
					<li>
						<div class="relative">
							<button
								class="flex w-full items-center justify-between rounded py-2 pl-3 pr-4 lg:w-auto lg:border-0 lg:p-0 lg:hover:bg-transparent lg:dark:hover:bg-transparent"
							>
								Copy-Pastes
							</button><!---->
						</div>
					</li>
				</ul>
				<div class="flex items-center gap-4 text-primary-300">
					<a href="https://github.com/quabey/med-aar/" target="_blank"><span>Github</span></a>
					<button>
						<span class=" border-l-2 border-white pl-4"> Contact </span>
					</button>
				</div>

				<!---->
			</div>
		</div>
	</nav>
	<!---->
</div>
