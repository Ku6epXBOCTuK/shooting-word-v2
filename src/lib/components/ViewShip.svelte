<script lang="ts">
	import { SHIP_COUNT } from "#lib/game/assets.js";
	import { loadShips } from "#lib/game/assets.ts";
	import {
		createMetalShimmer,
		type MetalShimmer,
	} from "#lib/vfx/metal-shimmer.ts";
	import { AnimatedSprite, Application, Graphics, Texture } from "pixi.js";
	import { onMount } from "svelte";
	import { updateShieldBubble } from "../vfx/shield-bubble";

	interface Props {
		effects: Record<string, boolean>;
		skin: number;
	}

	let { effects, skin }: Props = $props();

	let shieldEnabled = $derived(effects["shield"]);
	let armorCoatingEnabled = $derived(effects["ricochetium"]);

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;

	const app = new Application();
	let textures: Texture[][] = [];
	let width = $state(0);
	let height = $state(0);

	let armorShimmer: MetalShimmer | null = $state(null);
	let ship: AnimatedSprite | null = $derived(createShip(skin));
	let shield: Graphics | null = new Graphics();

	$effect(() => {
		if (ship && shield) updateShieldBubble(shield, ship, 3, shieldEnabled);
	});

	$effect(() => {
		const shipToDestroy = ship;
		if (ship) app.stage.addChild(ship);

		return () => {
			if (shipToDestroy) app.stage.removeChild(shipToDestroy);
		};
	});

	$effect(() => {
		if (!shield) return;
		if (shieldEnabled) {
			app.stage.addChild(shield);
		} else {
			app.stage.removeChild(shield);
		}
	});

	$effect(() => {
		if (ship) {
			if (armorCoatingEnabled && armorShimmer) {
				ship.filters = [armorShimmer.filter];
			} else {
				ship.filters = [];
			}
		}
	});

	onMount(() => {
		let destroyed = false;

		const setup = async () => {
			await app.init({
				canvas,
				resizeTo: container,
				backgroundAlpha: 0,
			});
			if (destroyed) return;

			armorShimmer = createMetalShimmer();

			textures = await loadShips();
			if (destroyed) return;

			width = app.screen.width;
			height = app.screen.height;

			ship = createShip(0);

			app.stage.addChild(ship!);

			app.ticker.add(() => {
				armorShimmer!.update(
					performance.now() / 1000,
					ship!.width / Math.max(ship!.height, 1),
				);
			});
		};

		setup();

		return () => {
			destroyed = true;
			app.destroy(false, { children: true });
		};
	});

	function createShip(skin: number): AnimatedSprite | null {
		if (textures.length === 0) return null;
		const frames = textures[skin % SHIP_COUNT];
		const ship = new AnimatedSprite(frames);

		ship.animationSpeed = 0.2;
		ship.play();
		ship.anchor.set(0.5);
		ship.scale.set(10);

		ship.x = width / 2;
		ship.y = height / 2;

		return ship;
	}
</script>

<div class="ship">
	Skin number: {skin + 1} <br />
	Shield: {shieldEnabled ?? false} <br />
	Armor: {armorCoatingEnabled ?? false} <br />
	<div class="hero-scene" bind:this={container}>
		<canvas bind:this={canvas}></canvas>
	</div>
</div>

<style>
</style>
