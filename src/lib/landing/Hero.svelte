<script lang="ts">
	import HeroScene from "./HeroScene.svelte";
</script>

<section class="hero">
	<div class="hero-copy">
		<h1>Сбивай слова<br /><em>до твоего корабля.</em></h1>
		<p class="hero-lede">
			Shooting Word превращает чат в поле боя. Слова-враги вылетают из портала —
			ты сбиваешь их до того, как они достигнут твоего корабля.
		</p>
	</div>

	<div class="hero-visual" aria-hidden="true">
		<HeroScene />
	</div>
</section>

<style>
	.hero {
		min-height: 476px;
		display: grid;
		grid-template-columns: 0.88fr 1.12fr;
		align-items: center;
		gap: 32px;
		width: min(1180px, calc(100% - 48px));
		margin-inline: auto;
	}

	.hero h1 {
		font-size: clamp(48px, 6vw, 82px);
		line-height: 0.94;
		letter-spacing: -0.07em;
		margin: 0 0 25px;
		font-weight: 700;
	}

	.hero h1 em {
		font-style: normal;
		color: var(--cyan);
	}

	.hero-lede {
		max-width: 465px;
		color: #a4a6ae;
		font-size: 17px;
		line-height: 1.65;
		margin: 0;
	}

	.hero-visual {
		height: 370px;
		position: relative;
		overflow: hidden;
	}

	@media (max-width: 760px) {
		.hero {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			padding-top: 64px;
			gap: 18px;
			width: min(100% - 32px, 560px);
		}

		.hero h1 {
			font-size: 54px;
		}

		.hero-visual {
			height: 260px;
			margin-top: 8px;
		}
	}
</style>
