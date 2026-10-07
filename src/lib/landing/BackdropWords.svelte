<script lang="ts">
	import { Application, Text } from "pixi.js";
	import { onMount } from "svelte";

	const WORDS = [
		"GG",
		"KEKW",
		"LMAO",
		"NICE SHOT",
		"PogChamp",
		"BASED",
		"o7",
		"CLIP IT",
		"GL HF",
		"WP",
		"OMG",
		"Hype",
	];

	const COLORS = ["#ecebe7", "#69d8e6", "#caff42", "#ff7042"];
	const WORDS_ON_SCREEN = 100;
	const FOCAL = 90;
	const SPEED_MIN = 0.04;
	const SPEED_MAX = 0.1;
	const ALPHA_MIN = 0.14;
	const ALPHA_MAX = 0.26;
	const Z_FAR = 1;
	const Z_NEAR = 0.02;

	interface WarpWord {
		text: Text;
		dirX: number;
		dirY: number;
		z: number;
		speed: number;
		maxAlpha: number;
	}

	let canvas: HTMLCanvasElement;

	const randomOf = <T,>(items: readonly T[]): T =>
		items[Math.floor(Math.random() * items.length)];

	onMount(() => {
		const app = new Application();
		const stars: WarpWord[] = [];
		let destroyed = false;

		const respawn = (star: WarpWord, initial = false) => {
			const angle = Math.random() * Math.PI * 2;
			star.dirX = Math.cos(angle);
			star.dirY = Math.sin(angle);
			star.z = initial ? Z_NEAR + Math.random() * (Z_FAR - Z_NEAR) : Z_FAR;
			star.speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
			star.maxAlpha = ALPHA_MIN + Math.random() * (ALPHA_MAX - ALPHA_MIN);
			star.text.text = randomOf(WORDS);
			star.text.style.fill = randomOf(COLORS);
		};

		const setup = async () => {
			await app.init({
				canvas,
				resizeTo: window,
				backgroundAlpha: 0,
			});
			if (destroyed) return;

			for (let i = 0; i < WORDS_ON_SCREEN; i++) {
				const text = new Text({
					text: "",
					style: {
						fontFamily: "Arial, Helvetica, sans-serif",
						fontSize: 16,
						fontWeight: "700",
						letterSpacing: 2,
						fill: "#ecebe7",
					},
				});
				text.anchor.set(0.5);

				const star: WarpWord = {
					text,
					dirX: 0,
					dirY: 0,
					z: Z_FAR,
					speed: 0.1,
					maxAlpha: 0.2,
				};
				respawn(star, true);

				stars.push(star);
				app.stage.addChild(text);
			}

			app.ticker.add(({ deltaMS }) => {
				const dt = deltaMS / 1000;
				const { width, height } = app.screen;
				const cx = width / 2;
				const cy = height / 2;

				for (const star of stars) {
					star.z -= star.speed * dt;
					if (star.z <= Z_NEAR) {
						respawn(star);
					}

					const p = FOCAL / star.z;

					const edgeX =
						(star.dirX > 0 ? width - cx : cx) /
						Math.max(Math.abs(star.dirX), 1e-4);
					const edgeY =
						(star.dirY > 0 ? height - cy : cy) /
						Math.max(Math.abs(star.dirY), 1e-4);
					const pEdge = Math.min(edgeX, edgeY) + 120;
					const progress = Math.min(p / pEdge, 1);

					if (progress >= 1) {
						respawn(star);
						continue;
					}

					star.text.x = cx + star.dirX * p;
					star.text.y = cy + star.dirY * p;
					star.text.scale.set(Math.min(0.25 / star.z, 2));

					const fadeIn = Math.min((progress / 0.2) ** 2, 1);
					const fadeOut = Math.min((1 - progress) / 0.15, 1);
					star.text.alpha = star.maxAlpha * fadeIn * fadeOut;
				}
			});
		};

		setup();

		return () => {
			destroyed = true;
			app.destroy(false, { children: true });
		};
	});
</script>

<canvas class="backdrop-words" bind:this={canvas} aria-hidden="true"></canvas>

<style>
	.backdrop-words {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
		pointer-events: none;
	}
</style>
