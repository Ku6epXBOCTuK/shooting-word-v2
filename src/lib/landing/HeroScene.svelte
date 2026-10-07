<script lang="ts">
	import { onMount } from "svelte";
	import { AnimatedSprite, Application } from "pixi.js";
	import { loadShips, SHIP_COUNT } from "#lib/game/assets.js";

	const SHIPS_ON_SCREEN = 5;

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;

	interface FlyingShip {
		sprite: AnimatedSprite;
		speed: number;
		bobAmplitude: number;
		bobPhase: number;
		baseY: number;
	}

	onMount(() => {
		const app = new Application();
		const ships: FlyingShip[] = [];
		let destroyed = false;

		const setup = async () => {
			await app.init({
				canvas,
				resizeTo: container,
				backgroundAlpha: 0,
			});
			if (destroyed) return;

			const textures = await loadShips();
			if (destroyed) return;

			for (let i = 0; i < SHIPS_ON_SCREEN; i++) {
				const frames = textures[i % SHIP_COUNT];
				const sprite = new AnimatedSprite(frames);
				sprite.animationSpeed = 0.12;
				sprite.play();
				sprite.anchor.set(0.5);
				sprite.scale.set(5);

				const ship: FlyingShip = {
					sprite,
					speed: 0.6 + Math.random() * 1.2,
					bobAmplitude: 6 + Math.random() * 10,
					bobPhase: Math.random() * Math.PI * 2,
					baseY: 0,
				};

				const width = app.screen.width;
				const height = app.screen.height;
				ship.baseY =
					(height / (SHIPS_ON_SCREEN + 1)) * (i + 1) +
					(Math.random() * 20 - 10);
				sprite.x = width + Math.random() * width;
				sprite.y = ship.baseY;

				ships.push(ship);
				app.stage.addChild(sprite);
			}

			app.ticker.add(({ deltaMS }) => {
				const dt = deltaMS / 16.66;
				const width = app.screen.width;
				for (const ship of ships) {
					ship.sprite.x -= ship.speed * dt;
					ship.bobPhase += 0.03 * dt;
					ship.sprite.y =
						ship.baseY + Math.sin(ship.bobPhase) * ship.bobAmplitude;
					if (ship.sprite.x < -80) {
						ship.sprite.x = width + 80;
					}
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

<div class="hero-scene" bind:this={container}>
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.hero-scene {
		position: absolute;
		inset: 0;
	}

	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
