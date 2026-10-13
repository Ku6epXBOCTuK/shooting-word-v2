<script lang="ts">
	import BackdropWords from "#lib/components/BackdropWords.svelte";
	import Button from "#lib/components/ui/Button.svelte";
	import ViewShip from "#lib/components/ViewShip.svelte";
	import { REWARD_CONFIGS } from "#lib/features/rewards/config.ts";

	const rewardsList = REWARD_CONFIGS.map(({ key, title }) => ({
		key,
		title,
	}));

	let skin: number = $state(0);
	let effects: Record<string, boolean> = $state({});

	function toggleEffect(effect: string) {
		effects[effect] = !effects[effect];
	}

	function nextSkin() {
		skin = (skin + 1) % 20;
	}

	function prevSkin() {
		skin = (skin - 1 + 20) % 20;
	}
</script>

<div class="scene">
	<main class="site-shell">
		<div class="noise" aria-hidden="true"></div>
		<div class="star-field" aria-hidden="true"></div>
		{#if false}
			<BackdropWords />
		{/if}
		<ViewShip {effects} {skin}></ViewShip>

		<Button onclick={prevSkin}>Prev Skin</Button>
		<Button onclick={nextSkin}>Next Skin</Button>

		{#each rewardsList as { key, title } (key)}
			<Button onclick={() => toggleEffect(key)}>{title}</Button>
		{/each}
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

	.site-shell {
		min-height: 100vh;
		overflow: hidden;
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

	:focus-visible {
		outline: 2px solid var(--cyan);
		outline-offset: 3px;
	}

	::selection {
		background: var(--cyan);
		color: #08090d;
	}
</style>
