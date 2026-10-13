<script lang="ts">
	import { Application } from "pixi.js";
	import { onMount } from "svelte";

	interface Props {
		onReady?: (app: Application) => void;
	}

	let { onReady }: Props = $props();

	let canvas: HTMLCanvasElement;
	const app: Application = new Application();

	onMount(() => {
		let destroyed = false;

		(async () => {
			await app.init({
				canvas,
				backgroundAlpha: 0,
				resizeTo: window,
				antialias: true,
			});
			if (destroyed) {
				app.destroy(true);
				return;
			}
			onReady?.(app);
		})();

		return () => {
			destroyed = true;
			app.destroy(true);
		};
	});
</script>

<div class="overlay">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.overlay {
		width: 80vw;
		height: 80vh;
		overflow: hidden;
		background: transparent;
	}
	canvas {
		display: block;
	}
</style>
