<section class="hero">
	<div class="hero-copy">
		<h1>Сбивай слова<br /><em>до твоего корабля.</em></h1>
		<p class="hero-lede">
			Shooting Word превращает чат в поле боя. Слова-враги вылетают из портала —
			ты сбиваешь их до того, как они достигнут твоего корабля.
		</p>
	</div>

	<div class="hero-visual" aria-hidden="true">
		<div class="radar-grid"></div>
		<div class="portal portal-back"></div>
		<div class="portal portal-main">
			<span class="portal-label">GATE 01</span>
		</div>
		<div class="ship">
			<div class="ship-wing ship-wing-left"></div>
			<div class="ship-body"></div>
			<div class="ship-wing ship-wing-right"></div>
			<div class="ship-engine"></div>
		</div>
		<div class="target target-one">GG EZ</div>
		<div class="target target-two">NICE SHOT</div>
		<div class="target target-three">LMAO</div>
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

	.radar-grid {
		position: absolute;
		width: 460px;
		height: 460px;
		border-radius: 50%;
		right: -45px;
		top: -42px;
		background:
			repeating-radial-gradient(
				circle,
				transparent 0 38px,
				rgba(105, 216, 230, 0.09) 39px 40px
			),
			repeating-conic-gradient(
				from 0deg,
				transparent 0 14deg,
				rgba(105, 216, 230, 0.06) 15deg 16deg
			);
		mask-image: radial-gradient(circle, black 0 56%, transparent 75%);
	}

	.portal {
		position: absolute;
		border-radius: 50%;
		transform: rotate(-20deg);
	}

	.portal-back {
		width: 255px;
		height: 100px;
		right: 86px;
		top: 110px;
		border: 1px solid rgba(105, 216, 230, 0.25);
		box-shadow: 0 0 45px rgba(105, 216, 230, 0.13);
	}

	.portal-main {
		width: 280px;
		height: 116px;
		right: 74px;
		top: 100px;
		border: 2px solid var(--cyan);
		box-shadow:
			0 0 22px rgba(105, 216, 230, 0.8),
			inset 0 0 34px rgba(105, 216, 230, 0.22);
	}

	.portal-main:before {
		content: "";
		position: absolute;
		inset: 12px;
		border: 1px solid rgba(202, 255, 66, 0.56);
		border-radius: inherit;
	}

	.portal-label {
		position: absolute;
		right: 8px;
		bottom: -28px;
		font-size: 9px;
		letter-spacing: 0.18em;
		color: var(--cyan);
	}

	.ship {
		position: absolute;
		right: 215px;
		top: 160px;
		width: 116px;
		height: 34px;
		transform: rotate(-18deg);
		filter: drop-shadow(0 0 12px rgba(202, 255, 66, 0.5));
	}

	.ship-body {
		position: absolute;
		width: 96px;
		height: 18px;
		top: 8px;
		left: 10px;
		background: linear-gradient(90deg, #b7e73c, #efffc0 50%, #6d9d2d);
		clip-path: polygon(0 50%, 17% 0, 76% 10%, 100% 50%, 76% 90%, 17% 100%);
	}

	.ship-wing {
		position: absolute;
		width: 48px;
		height: 18px;
		background: #82af2d;
		top: 2px;
		clip-path: polygon(0 100%, 100% 0, 70% 100%);
	}

	.ship-wing-left {
		left: 18px;
		transform: rotate(16deg);
	}

	.ship-wing-right {
		right: 5px;
		transform: scaleX(-1) rotate(16deg);
	}

	.ship-engine {
		position: absolute;
		width: 14px;
		height: 5px;
		left: -1px;
		top: 15px;
		background: var(--orange);
		box-shadow: 0 0 14px var(--orange);
	}

	.target {
		position: absolute;
		color: var(--foreground);
		border: 1px solid rgba(255, 255, 255, 0.38);
		padding: 5px 8px;
		font-size: 9px;
		letter-spacing: 0.12em;
		background: rgba(8, 9, 13, 0.7);
	}

	.target:after {
		content: "";
		position: absolute;
		width: 4px;
		height: 4px;
		background: var(--orange);
		right: -3px;
		top: -3px;
	}

	.target-one {
		right: 36px;
		top: 66px;
		color: var(--orange);
	}

	.target-two {
		right: 24px;
		bottom: 66px;
		color: var(--cyan);
	}

	.target-three {
		left: 35px;
		top: 76px;
		color: var(--lime);
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
			transform: scale(0.9);
			transform-origin: left center;
		}
	}
</style>
