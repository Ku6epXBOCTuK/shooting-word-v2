<script lang="ts">
	import { Application } from "pixi.js";
	import { onMount } from "svelte";

	let canvas: HTMLCanvasElement;
	export const app: Application = new Application();

	onMount(() => {
		let destroyed = false;

		(async () => {
			await app.init({
				canvas,
				backgroundAlpha: 0,
				resizeTo: window,
				antialias: true,
			});
			if (destroyed) app.destroy(true);
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
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: transparent;
	}
	canvas {
		display: block;
	}
</style>
