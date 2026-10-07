<script lang="ts">
	import CommanderCard from "#lib/landing/CommanderCard.svelte";
	import BackdropWords from "#lib/landing/BackdropWords.svelte";
	import Hero from "#lib/landing/Hero.svelte";
	import ScoutCard from "#lib/landing/ScoutCard.svelte";
</script>

<div class="scene">
	<main class="site-shell">
		<div class="noise" aria-hidden="true"></div>
		<div class="star-field" aria-hidden="true"></div>
		<BackdropWords />

		<Hero />

		<section class="launch-section" id="launch">
			<div class="section-heading">
				<p>Выбери точку входа в игру</p>
			</div>

			<div class="launch-grid">
				<ScoutCard />
				<CommanderCard />
			</div>
		</section>
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
			radial-gradient(circle, rgba(105, 216, 230, 0.55) 0 1px, transparent 1px);
		background-size:
			83px 97px,
			137px 151px;
		background-position:
			12px 16px,
			52px 71px;
		mask-image: linear-gradient(to bottom, black, transparent 80%);
	}

	.launch-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.launch-section {
		border-top: 1px solid var(--line);
		padding: 38px 0 74px;
		width: min(1180px, calc(100% - 48px));
		margin-inline: auto;
	}

	.section-heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 22px;
	}

	.section-heading p {
		color: var(--muted);
		font-size: 14px;
		margin: 0;
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
		.launch-grid {
			grid-template-columns: 1fr;
		}

		.launch-section {
			padding-top: 26px;
			width: min(100% - 32px, 560px);
		}

		.section-heading {
			display: block;
		}

		.section-heading p {
			margin-top: 10px;
		}
	}
</style>
