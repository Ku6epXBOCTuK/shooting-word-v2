<script lang="ts">
	import { loadSession, type CabinetSession } from "#lib/cabinet/api.js";
	import RewardsCard from "#lib/cabinet/RewardsCard.svelte";
	import TopBar from "#lib/cabinet/TopBar.svelte";
	import UnauthorizedCard from "#lib/cabinet/UnauthorizedCard.svelte";
	import WidgetCard from "#lib/cabinet/WidgetCard.svelte";
	import { features } from "#lib/features/variant.js";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { onMount } from "svelte";

	let loading = $state(true);
	let session = $state<CabinetSession | null>(null);
	let widgetUuid = $state<string | null>(null);

	const widgetLink = $derived(
		session && widgetUuid
			? `${page.url.origin}${resolve("/widget")}?uuid=${encodeURIComponent(widgetUuid)}`
			: null,
	);

	onMount(async () => {
		session = await loadSession();
		widgetUuid = session?.widgetUuid ?? null;
		loading = false;
	});
</script>

<svelte:head>
	<title>Кабинет командира — Shooting Word</title>
</svelte:head>

<div class="scene">
	<main class="shell">
		<div class="noise" aria-hidden="true"></div>
		<div class="star-field" aria-hidden="true"></div>

		<div class="content">
			<TopBar displayName={session?.displayName ?? null} />

			<h1>Кабинет <em>командира</em></h1>

			{#if loading}
				<p class="loading">Загрузка кабинета…</p>
			{:else if !session}
				<div class="cards">
					<UnauthorizedCard />
				</div>
			{:else}
				<div class="cards">
					{#if widgetLink}
						<WidgetCard
							link={widgetLink}
							onrotated={(uuid) => {
								widgetUuid = uuid;
							}}
						/>
					{/if}

					{#if features.rewards}
						<RewardsCard
							authorized={session.rewardsAuthorized}
							status={session.rewardsStatus}
						/>
					{/if}
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	.scene {
		--background: #08090d;
		--foreground: #ecebe7;
		--muted: #8b8e98;
		--line: rgba(255, 255, 255, 0.11);
		--panel: oklch(27% 0.02 272.464 / 0.86);
		--lime: #caff42;
		--cyan: #69d8e6;
		--orange: #ff7042;
		position: fixed;
		inset: 0;
		overflow-y: auto;
		background: var(--background);
		color: var(--foreground);
		font-family: Arial, Helvetica, sans-serif;
	}

	.shell {
		min-height: 100vh;
		position: relative;
		isolation: isolate;
		background:
			radial-gradient(
				circle at 74% 16%,
				rgba(43, 77, 86, 0.22),
				transparent 29rem
			),
			#08090d;
	}

	.content {
		width: min(1440px, calc(100% - 48px));
		margin-inline: auto;
		padding: 32px 0 74px;
	}

	.noise {
		position: fixed;
		inset: 0;
		z-index: -1;
		opacity: 0.035;
		pointer-events: none;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E");
	}

	.star-field {
		position: absolute;
		z-index: -1;
		inset: 0;
		opacity: 0.34;
		background-image:
			radial-gradient(circle, rgba(255, 255, 255, 0.72) 0 1px, transparent 1px),
			radial-gradient(
				circle,
				color-mix(in srgb, var(--cyan) 55%, transparent) 0 1px,
				transparent 1px
			);
		background-size:
			83px 97px,
			137px 151px;
		background-position:
			12px 16px,
			52px 71px;
		mask-image: linear-gradient(to bottom, black, transparent 80%);
	}

	h1 {
		font-size: clamp(38px, 4.5vw, 56px);
		letter-spacing: -0.05em;
		margin: 48px 0 36px;
		font-weight: 700;
	}

	h1 em {
		font-style: normal;
		color: var(--cyan);
	}

	.cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		align-items: stretch;
	}

	.content :global(.launch-card) {
		padding: 34px;
	}

	.content :global(.launch-card h2) {
		font-size: 34px;
	}

	.content :global(.card-subtitle) {
		font-size: 18px;
	}

	.content :global(.field-label) {
		font-size: 14px;
	}

	.content :global(.button) {
		font-size: 16px;
		padding: 18px 20px;
	}

	.content :global(.copy-field-input) {
		font-size: 15px;
		padding: 14px;
	}

	.content :global(.copy-field-button) {
		width: 48px;
	}

	.loading {
		color: var(--muted);
		font-size: 17px;
		margin: 24px 0;
		animation: loading-pulse 1.4s ease-in-out infinite;
	}

	@keyframes loading-pulse {
		0%,
		100% {
			opacity: 1;
		}

		50% {
			opacity: 0.45;
		}
	}

	:focus-visible {
		outline: 2px solid var(--cyan);
		outline-offset: 3px;
	}

	::selection {
		background: var(--cyan);
		color: #08090d;
	}

	@media (max-width: 760px) {
		.content {
			width: min(100% - 32px, 560px);
			padding-top: 24px;
		}

		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>
