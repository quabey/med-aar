<script>
	import { page } from '$app/state';
	import { supabase } from '$lib/supabaseClient.js';
	import { goto } from '$app/navigation';

	const isLoggedIn = $derived(!!page.data.session && page.data.profile?.is_approved);
	const profile = $derived(page.data.profile ?? null);

	let userMenuOpen = $state(false);

	async function loginWithDiscord() {
		await supabase.auth.signInWithOAuth({
			provider: 'discord',
			options: {
				scopes: 'identify email guilds.members.read',
				redirectTo: `${window.location.origin}/auth/callback`
			}
		});
	}

	async function logout() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<title>Med-Tools — Medrunner Resource Hub</title>
	<meta property="og:title" content="Med-Tools — Medrunner Resource Hub" />
	<meta property="og:description" content="The premier unofficial resource hub for Medrunners. AAR builder, profiles, leaderboard, dispatch tools and more." />
</svelte:head>

<!-- Top-right corner: minimal monochrome auth -->
<div class="corner-auth">
	{#if isLoggedIn && profile}
		<div class="relative">
			<button class="corner-user" onclick={() => (userMenuOpen = !userMenuOpen)}>
				{#if profile.discord_avatar}
					<img src={profile.discord_avatar} alt="" class="corner-avatar" />
				{:else}
					<div class="corner-avatar-fallback">{profile.discord_username?.charAt(0) ?? '?'}</div>
				{/if}
				<span>{profile.discord_username}</span>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="corner-chevron">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if userMenuOpen}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="fixed inset-0 z-40" onclick={() => (userMenuOpen = false)} onkeydown={() => {}}></div>
				<div class="corner-menu">
					{#if profile.rsi_handle}
						<a href="/medrunner/{encodeURIComponent(profile.rsi_handle)}" class="corner-menu-item" onclick={() => (userMenuOpen = false)}>
							My Profile
						</a>
					{/if}
					{#if profile.is_admin}
						<a href="/admin" class="corner-menu-item" onclick={() => (userMenuOpen = false)}>Admin</a>
					{/if}
					<div class="corner-menu-divider"></div>
					<button class="corner-menu-item corner-menu-logout" onclick={logout}>Log Out</button>
				</div>
			{/if}
		</div>
	{:else}
		<button class="corner-login" onclick={loginWithDiscord}>Log In</button>
	{/if}
</div>

<div class="landing">
	<!-- Animated SVG background -->
	<svg class="bg-svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<!-- Static star field -->
		<g opacity="0.6">
			<circle cx="120" cy="80" r="0.8" fill="#e8e4dc"/>
			<circle cx="340" cy="200" r="1.2" fill="#e8e4dc"/>
			<circle cx="580" cy="60" r="0.6" fill="#e8e4dc"/>
			<circle cx="760" cy="140" r="1.0" fill="#e8e4dc"/>
			<circle cx="920" cy="40" r="0.7" fill="#e8e4dc"/>
			<circle cx="1100" cy="170" r="1.3" fill="#e8e4dc"/>
			<circle cx="1300" cy="90" r="0.8" fill="#e8e4dc"/>
			<circle cx="1480" cy="220" r="0.9" fill="#e8e4dc"/>
			<circle cx="1680" cy="55" r="1.1" fill="#e8e4dc"/>
			<circle cx="1820" cy="190" r="0.6" fill="#e8e4dc"/>
			<circle cx="200" cy="380" r="0.9" fill="#e8e4dc"/>
			<circle cx="450" cy="500" r="0.7" fill="#e8e4dc"/>
			<circle cx="700" cy="430" r="1.2" fill="#e8e4dc"/>
			<circle cx="850" cy="600" r="0.8" fill="#e8e4dc"/>
			<circle cx="1050" cy="480" r="0.6" fill="#e8e4dc"/>
			<circle cx="1250" cy="550" r="1.0" fill="#e8e4dc"/>
			<circle cx="1550" cy="410" r="0.9" fill="#e8e4dc"/>
			<circle cx="1750" cy="530" r="0.7" fill="#e8e4dc"/>
			<circle cx="80" cy="700" r="1.1" fill="#e8e4dc"/>
			<circle cx="300" cy="820" r="0.8" fill="#e8e4dc"/>
			<circle cx="600" cy="760" r="0.6" fill="#e8e4dc"/>
			<circle cx="900" cy="900" r="1.2" fill="#e8e4dc"/>
			<circle cx="1150" cy="780" r="0.7" fill="#e8e4dc"/>
			<circle cx="1400" cy="850" r="1.0" fill="#e8e4dc"/>
			<circle cx="1700" cy="720" r="0.9" fill="#e8e4dc"/>
			<circle cx="1880" cy="900" r="0.6" fill="#e8e4dc"/>
			<circle cx="50" cy="950" r="0.8" fill="#e8e4dc"/>
			<circle cx="500" cy="1020" r="1.1" fill="#e8e4dc"/>
			<circle cx="1000" cy="1000" r="0.7" fill="#e8e4dc"/>
			<circle cx="1600" cy="980" r="0.9" fill="#e8e4dc"/>
		</g>

		<!-- Planet 1: large ringed planet, top-right -->
		<g class="planet-1">
			<circle cx="1520" cy="220" r="72" fill="none" stroke="#c8c4bc" stroke-width="0.5" opacity="0.18"/>
			<circle cx="1520" cy="220" r="68" fill="#111110" stroke="#c8c4bc" stroke-width="0.3" opacity="0.12"/>
			<!-- Ring -->
			<ellipse cx="1520" cy="220" rx="110" ry="22" fill="none" stroke="#c8c4bc" stroke-width="0.8" opacity="0.14" transform="rotate(-15 1520 220)"/>
			<ellipse cx="1520" cy="220" rx="95" ry="16" fill="none" stroke="#c8c4bc" stroke-width="0.4" opacity="0.10" transform="rotate(-15 1520 220)"/>
			<!-- Surface detail -->
			<path d="M1460,210 Q1490,195 1520,200 Q1550,205 1580,215" fill="none" stroke="#c8c4bc" stroke-width="0.4" opacity="0.12"/>
			<path d="M1455,225 Q1485,215 1520,218 Q1555,221 1582,230" fill="none" stroke="#c8c4bc" stroke-width="0.3" opacity="0.09"/>
		</g>

		<!-- Planet 2: medium planet, lower-left -->
		<g class="planet-2">
			<circle cx="320" cy="780" r="48" fill="#0d0d0c" stroke="#b8b4ac" stroke-width="0.5" opacity="0.20"/>
			<circle cx="320" cy="780" r="46" fill="none" stroke="#b8b4ac" stroke-width="0.3" opacity="0.10"/>
			<!-- Terminator line -->
			<path d="M320,734 Q298,756 296,780 Q298,804 320,828" fill="none" stroke="#d0ccC4" stroke-width="0.6" opacity="0.16"/>
			<!-- Surface bands -->
			<path d="M290,770 Q310,765 340,768 Q360,770 368,774" fill="none" stroke="#b8b4ac" stroke-width="0.4" opacity="0.12"/>
			<path d="M285,785 Q308,781 340,783 Q362,785 370,788" fill="none" stroke="#b8b4ac" stroke-width="0.3" opacity="0.09"/>
		</g>

		<!-- Planet 3: small distant planet, top-left -->
		<g class="planet-3">
			<circle cx="180" cy="200" r="22" fill="#0e0e0d" stroke="#a8a49c" stroke-width="0.5" opacity="0.22"/>
			<circle cx="180" cy="200" r="20" fill="none" stroke="#a8a49c" stroke-width="0.3" opacity="0.10"/>
			<path d="M168,195 Q175,190 183,192 Q190,194 193,200" fill="none" stroke="#c0bcb4" stroke-width="0.5" opacity="0.18"/>
		</g>

		<!-- Planet 4: tiny dot planet, center-right -->
		<g class="planet-4">
			<circle cx="1720" cy="700" r="12" fill="#0c0c0b" stroke="#908c84" stroke-width="0.5" opacity="0.20"/>
		</g>

	</svg>

	<!-- Content -->
	<div class="content">
		<div class="hero">
			<p class="eyebrow">STAR CITIZEN · MEDRUNNER</p>
			<h1>MED-TOOLS</h1>
			<p class="tagline">The unofficial resource hub for Medrunners</p>
		</div>

		<div class="features">
			<a href="/aar" class="feature-card">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
				</svg>
				<span>AAR Builder</span>
				<p>Build and format After Action Reports</p>
			</a>
			<a href="/medrunner" class="feature-card">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
				</svg>
				<span>Profiles</span>
				<p>Stats and history for every Medrunner</p>
			</a>
			<a href="/leaderboard" class="feature-card">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/>
				</svg>
				<span>Leaderboard</span>
				<p>Top responders, streaks, and rankings</p>
			</a>
			<a href="/alerts" class="feature-card">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
				</svg>
				<span>Alerts</span>
				<p>Live and historical alert feed</p>
			</a>
		</div>

		{#if !isLoggedIn}
			<div class="cta">
				<button class="btn-ghost" onclick={loginWithDiscord}>Log In with Discord</button>
			</div>
		{/if}
	</div>

	<!-- Foreground SVG: shooting stars + spaceship — rendered above the cards -->
	<svg class="fg-svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<defs>
			<path id="ship-orbit" d="M 80,30 L 1840,30 L 1840,1050 L 80,1050 Z"/>
		</defs>

		<!-- Shooting stars -->
		<line class="star-1" x1="0" y1="0" x2="150" y2="0" stroke="#e8e4dc" stroke-width="1.2" stroke-linecap="round" opacity="0"/>
		<line class="star-2" x1="0" y1="0" x2="120" y2="0" stroke="#e8e4dc" stroke-width="0.9" stroke-linecap="round" opacity="0"/>
		<line class="star-3" x1="0" y1="0" x2="170" y2="0" stroke="#e8e4dc" stroke-width="1.0" stroke-linecap="round" opacity="0"/>
		<line class="star-4" x1="0" y1="0" x2="130" y2="0" stroke="#e8e4dc" stroke-width="0.8" stroke-linecap="round" opacity="0"/>
		<line class="star-5" x1="0" y1="0" x2="160" y2="0" stroke="#e8e4dc" stroke-width="1.1" stroke-linecap="round" opacity="0"/>

		<!-- Spaceship orbiting the edges -->
		<g>
			<!-- 12° tilt gives the ship attitude relative to direction of travel -->
			<g transform="rotate(12)">
				<!-- Exhaust trail: single straight line behind ship -->
				<line x1="-90" y1="0" x2="-2" y2="0" stroke="#c8c4bc" stroke-width="1" stroke-linecap="round" opacity="0.35"/>
				<!-- Ship body -->
				<polygon points="13,0 -5,-5 -3,0 -5,5" fill="#c8c4bc" opacity="0.55"/>
				<!-- Cockpit line -->
				<line x1="5" y1="-1.5" x2="11" y2="0" stroke="#d8d4cc" stroke-width="0.8" opacity="0.3"/>
				<!-- Engine glow -->
				<circle cx="-3" cy="0" r="2">
					<animate attributeName="r"       values="2;3.2;2"         dur="1.8s" repeatCount="indefinite"/>
					<animate attributeName="opacity" values="0.4;0.6;0.4"     dur="1.8s" repeatCount="indefinite"/>
					<animate attributeName="fill"    values="#d0ccc4;#e8e4dc;#d0ccc4" dur="1.8s" repeatCount="indefinite"/>
				</circle>
			</g>
			<animateMotion dur="200s" repeatCount="indefinite" rotate="auto">
				<mpath href="#ship-orbit"/>
			</animateMotion>
		</g>
	</svg>

	<!-- Footer -->
	<div class="landing-footer">
		<a href="https://github.com/quabey/med-aar/" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub</a>
		<span class="footer-sep">·</span>
		<a href="/credits" class="footer-link">Credits</a>
	</div>
</div>

<style>
	.landing {
		position: relative;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: #070707;
	}

	.bg-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
	}

	.fg-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 15;
		pointer-events: none;
	}

	/* Planet slow drift animations */
	.planet-1 {
		animation: drift-1 90s ease-in-out infinite alternate;
	}
	.planet-2 {
		animation: drift-2 120s ease-in-out infinite alternate;
	}
	.planet-3 {
		animation: drift-3 75s ease-in-out infinite alternate;
	}
	.planet-4 {
		animation: drift-4 100s ease-in-out infinite alternate;
	}

	@keyframes drift-1 {
		from { transform: translate(0, 0); }
		to   { transform: translate(-30px, 20px); }
	}
	@keyframes drift-2 {
		from { transform: translate(0, 0); }
		to   { transform: translate(20px, -25px); }
	}
	@keyframes drift-3 {
		from { transform: translate(0, 0); }
		to   { transform: translate(15px, 18px); }
	}
	@keyframes drift-4 {
		from { transform: translate(0, 0); }
		to   { transform: translate(-18px, -15px); }
	}

	/* Shooting stars */
	.star-1 { animation: shoot-1 13s linear 2s infinite; }
	.star-2 { animation: shoot-2 13s linear 6s infinite; }
	.star-3 { animation: shoot-3 13s linear 10s infinite; }
	.star-4 { animation: shoot-4 13s linear 4s infinite; }
	.star-5 { animation: shoot-5 13s linear 11s infinite; }

	@keyframes shoot-1 {
		0%   { transform: translate(280px, 90px)   rotate(34deg); opacity: 0; }
		3%   { opacity: 0.7; }
		17%  { opacity: 0.15; }
		20%  { transform: translate(1000px, 510px) rotate(34deg); opacity: 0; }
		100% { transform: translate(1000px, 510px) rotate(34deg); opacity: 0; }
	}
	@keyframes shoot-2 {
		0%   { transform: translate(1050px, 60px)  rotate(40deg); opacity: 0; }
		3%   { opacity: 0.5; }
		17%  { opacity: 0.12; }
		20%  { transform: translate(1680px, 480px) rotate(40deg); opacity: 0; }
		100% { transform: translate(1680px, 480px) rotate(40deg); opacity: 0; }
	}
	@keyframes shoot-3 {
		0%   { transform: translate(150px, 260px)  rotate(27deg); opacity: 0; }
		3%   { opacity: 0.6; }
		17%  { opacity: 0.15; }
		20%  { transform: translate(850px, 650px)  rotate(27deg); opacity: 0; }
		100% { transform: translate(850px, 650px)  rotate(27deg); opacity: 0; }
	}
	@keyframes shoot-4 {
		0%   { transform: translate(860px, 170px)  rotate(37deg); opacity: 0; }
		3%   { opacity: 0.75; }
		17%  { opacity: 0.18; }
		20%  { transform: translate(1560px, 430px) rotate(37deg); opacity: 0; }
		100% { transform: translate(1560px, 430px) rotate(37deg); opacity: 0; }
	}
	@keyframes shoot-5 {
		0%   { transform: translate(520px, 40px)   rotate(31deg); opacity: 0; }
		3%   { opacity: 0.55; }
		17%  { opacity: 0.12; }
		20%  { transform: translate(1200px, 370px) rotate(31deg); opacity: 0; }
		100% { transform: translate(1200px, 370px) rotate(31deg); opacity: 0; }
	}

	/* Content */
	.content {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3rem;
		padding: 2rem 1.5rem;
		text-align: center;
	}

	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.eyebrow {
		font-family: 'Mohave', monospace;
		font-size: 0.7rem;
		letter-spacing: 0.35em;
		color: #5a5852;
		margin: 0;
	}

	h1 {
		font-family: 'Mohave', monospace;
		font-size: clamp(3.5rem, 8vw, 7rem);
		font-weight: 700;
		letter-spacing: 0.15em;
		color: #ede9e0;
		margin: 0;
		line-height: 1;
	}

	.tagline {
		font-family: 'Mohave', monospace;
		font-size: clamp(0.85rem, 2vw, 1.05rem);
		letter-spacing: 0.12em;
		color: #6a6860;
		margin: 0;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		max-width: 640px;
		width: 100%;
	}

	@media (min-width: 640px) {
		.features {
			grid-template-columns: repeat(4, 1fr);
			max-width: 800px;
		}
	}

	.feature-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.25rem 1rem;
		border: 1px solid #1e1e1c;
		border-radius: 0.75rem;
		background: rgba(14, 14, 12, 0.7);
		backdrop-filter: blur(4px);
		text-decoration: none;
		color: inherit;
		transition: border-color 0.2s, background 0.2s;
	}

	.feature-card:hover {
		border-color: #3a3a36;
		background: rgba(22, 22, 20, 0.9);
	}

	.feature-card svg {
		width: 1.75rem;
		height: 1.75rem;
		color: #7a7870;
		flex-shrink: 0;
	}

	.feature-card span {
		font-family: 'Mohave', monospace;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: #ccc8c0;
	}

	.feature-card p {
		font-size: 0.72rem;
		color: #504e4a;
		margin: 0;
		line-height: 1.4;
	}

	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
	}

	.btn-ghost {
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.75rem;
		border: 1px solid #2a2a28;
		border-radius: 0.5rem;
		background: transparent;
		color: #7a7870;
		font-family: 'Mohave', monospace;
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-decoration: none;
		transition: border-color 0.15s, color 0.15s;
	}

	.btn-ghost:hover {
		border-color: #4a4a46;
		color: #b0aca4;
	}

	/* Corner auth */
	.corner-auth {
		position: fixed;
		top: 1rem;
		right: 1.25rem;
		z-index: 50;
	}

	.corner-login {
		background: transparent;
		border: 1px solid #2a2a28;
		border-radius: 0.4rem;
		color: #6a6860;
		font-family: 'Mohave', monospace;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		padding: 0.4rem 1rem;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}

	.corner-login:hover {
		border-color: #3a3a36;
		color: #9a9890;
	}

	.corner-user {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: transparent;
		border: 1px solid #1e1e1c;
		border-radius: 0.4rem;
		color: #5a5852;
		font-family: 'Mohave', monospace;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		padding: 0.35rem 0.75rem 0.35rem 0.4rem;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}

	.corner-user:hover {
		border-color: #2e2e2c;
		color: #8a8880;
	}

	.corner-avatar {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		opacity: 0.7;
	}

	.corner-avatar-fallback {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: #1e1e1c;
		color: #6a6860;
		font-size: 0.65rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.corner-chevron {
		width: 0.7rem;
		height: 0.7rem;
		opacity: 0.5;
	}

	.corner-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 0.4rem);
		z-index: 50;
		min-width: 10rem;
		background: #0e0e0c;
		border: 1px solid #222220;
		border-radius: 0.5rem;
		padding: 0.25rem 0;
		box-shadow: 0 8px 24px rgba(0,0,0,0.6);
	}

	.corner-menu-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.875rem;
		font-family: 'Mohave', monospace;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: #5a5852;
		background: transparent;
		border: none;
		cursor: pointer;
		text-decoration: none;
		transition: color 0.12s, background 0.12s;
	}

	.corner-menu-item:hover {
		color: #a0a098;
		background: #161614;
	}

	.corner-menu-divider {
		height: 1px;
		background: #1a1a18;
		margin: 0.25rem 0;
	}

	.corner-menu-logout {
		color: #4a4844;
	}

	.corner-menu-logout:hover {
		color: #7a7870;
	}

	/* Footer */
	.landing-footer {
		position: absolute;
		bottom: 1.25rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 10;
	}

	.footer-link {
		font-family: 'Mohave', monospace;
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		color: #3a3832;
		text-decoration: none;
		transition: color 0.15s;
	}

	.footer-link:hover {
		color: #5a5852;
	}

	.footer-sep {
		font-size: 0.7rem;
		color: #2a2826;
	}
</style>
