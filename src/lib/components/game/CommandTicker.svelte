<script lang="ts">
	const HINTS = [
		"слово - выстрел по врагу",
		"!скин - случайный корабль",
		"!скин [7] - выбрать корабль",
		"!ремонт - починить себя",
		"!ремонт [@ник] - починить чужой корабль",
	];
</script>

<div class="ticker" aria-hidden="true">
	<div class="track">
		{#each [0, 1, 2] as copy (copy)}
			<div class="group">
				{#each HINTS as hint (hint)}
					<span class="item">{hint}</span>
					<span class="sep">•</span>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.ticker {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		height: 24px;
		z-index: 10;
		overflow: hidden;
		pointer-events: none;
		display: flex;
		align-items: center;
		color: #ecebe7;
		font-family: Arial, Helvetica, sans-serif;
		font-size: 14px;
		font-weight: bold;
		white-space: nowrap;
	}

	.track {
		display: flex;
		width: max-content;
		animation: ticker-scroll 40s linear infinite;
	}

	.group {
		display: flex;
		align-items: center;
	}

	.item {
		padding: 0 12px;
	}

	.sep {
		padding: 0 16px;
		color: #69d8e6;
	}

	@keyframes ticker-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ticker {
			justify-content: center;
		}
		.track {
			animation: none;
		}
		.group:last-child {
			display: none;
		}
	}
</style>
