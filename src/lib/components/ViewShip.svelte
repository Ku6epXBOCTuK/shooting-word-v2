<script lang="ts">
	import { SHIP_COUNT, loadShips } from "#lib/game/assets.ts";
	import { SHIELD_MAX_HP } from "#lib/game/config.ts";
	import { createVfxLayer, type VfxLayer } from "#lib/vfx/layer.ts";
	import { createAura, createCoating } from "#lib/vfx/registry.ts";
	import type { ShieldAuraState } from "#lib/vfx/shield.ts";
	import type { VfxAura, VfxFilter } from "#lib/vfx/types.ts";
	import { AnimatedSprite, Application, type Texture } from "pixi.js";
	import { onMount } from "svelte";

	interface Props {
		effects: Record<string, boolean>;
		skin: number;
	}

	let { effects, skin }: Props = $props();

	let shieldEnabled = $derived(effects["shield"] ?? false);
	let armorCoatingEnabled = $derived(effects["ricochetium"] ?? false);

	const SCALE = 10;
	const CHARGES = 3;

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;

	const app = new Application();
	let layer = $state<VfxLayer | null>(null);
	let textures = $state<Texture[][]>([]);
	let ship = $state<AnimatedSprite | null>(null);
	let shield = $state<VfxAura<ShieldAuraState> | null>(null);
	let shimmer = $state<VfxFilter | null>(null);

	onMount(() => {
		let destroyed = false;

		const setup = async () => {
			await app.init({
				canvas,
				resizeTo: container,
				backgroundAlpha: 0,
			});
			if (destroyed) return;

			layer = createVfxLayer(app.stage);
			textures = await loadShips();
			if (destroyed) return;

			app.ticker.add((ticker) => {
				const dt = Math.min(ticker.deltaMS, 50) / 1000;
				const current = ship;
				if (current) {
					current.x = app.screen.width / 2;
					current.y = app.screen.height / 2;
				}
				layer?.move(shield as VfxAura<ShieldAuraState>, {
					x: current?.x ?? 0,
					y: current?.y ?? 0,
					scale: SCALE,
				});
				layer?.update(dt);
			});
		};

		void setup();

		return () => {
			destroyed = true;
			ship = null;
			shield = null;
			shimmer = null;
			layer?.destroy();
			layer = null;
			app.destroy(false, { children: true });
		};
	});

	$effect(() => {
		const frames = textures[skin % SHIP_COUNT];
		if (!layer || !frames?.length) return;

		const sprite = new AnimatedSprite(frames);
		sprite.animationSpeed = 0.2;
		sprite.play();
		sprite.anchor.set(0.5);
		sprite.scale.set(SCALE);
		sprite.x = app.screen.width / 2;
		sprite.y = app.screen.height / 2;
		app.stage.addChild(sprite);
		ship = sprite;

		return () => {
			layer?.unfilter(sprite);
			layer?.remove(shield as VfxAura<ShieldAuraState>);
			sprite.destroy();
			if (ship === sprite) ship = null;
		};
	});

	$effect(() => {
		const current = ship;
		if (!layer || !current) return;
		if (!shieldEnabled) return;

		const aura = createAura("shield", {
			x: current.x,
			y: current.y,
			scale: SCALE,
			rng: Math.random,
		}) as VfxAura<ShieldAuraState> | undefined;
		if (!aura) return;

		aura.state = {
			hp: CHARGES,
			max: SHIELD_MAX_HP,
			radius: Math.max(current.width, current.height) / 2,
		};
		layer.add(aura, { x: current.x, y: current.y, scale: SCALE });
		shield = aura;

		return () => {
			layer?.remove(aura);
			if (shield === aura) shield = null;
		};
	});

	$effect(() => {
		const current = ship;
		if (!layer || !current) return;
		if (!armorCoatingEnabled) return;

		const coating = createCoating("ricochetium");
		if (!coating) return;
		layer.filter(current, coating);
		shimmer = coating;

		return () => {
			layer?.unfilter(current);
			if (shimmer === coating) shimmer = null;
		};
	});
</script>

<div class="ship">
	Skin number: {skin + 1} <br />
	Shield: {shieldEnabled} <br />
	Armor: {armorCoatingEnabled} <br />
	<div class="hero-scene" bind:this={container}>
		<canvas bind:this={canvas}></canvas>
	</div>
</div>

<style>
</style>
