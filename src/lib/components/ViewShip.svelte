<script lang="ts">
	import { SHIP_COUNT, loadShips } from "#lib/game/assets.ts";
	import { SHIELD_MAX_HP } from "#lib/game/config.ts";
	import { createVfxLayer, type VfxLayer } from "#lib/vfx/layer.ts";
	import { createAura, createCoating } from "#lib/vfx/registry.ts";
	import { SHIELD_HIT_DECAY_MS } from "#lib/vfx/durations.ts";
	import type { ShieldAuraState, VfxStateful } from "#lib/vfx/types.ts";
	import { AnimatedSprite, Application, type Texture } from "pixi.js";
	import { onMount } from "svelte";

	interface Props {
		effects: Record<string, boolean>;
		skin: number;
	}

	let { effects, skin }: Props = $props();

	let shieldEnabled = $derived(effects["shield"] ?? false);
	let armorCoatingEnabled = $derived(effects["ricochetium"] ?? false);
	let overchargeEnabled = $derived(effects["overcharge"] ?? false);

	const SCALE = 10;
	const CHARGES = 3;
	/** как часто предпросмотр имитирует попадание, сек */
	const HIT_CYCLE = 2.5;
	const DECAY_SEC = SHIELD_HIT_DECAY_MS / 1000;

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;

	const app = new Application();
	let layer = $state<VfxLayer | null>(null);
	let textures = $state<Texture[][]>([]);
	let ship = $state<AnimatedSprite | null>(null);
	let shield = $state<VfxStateful<ShieldAuraState> | null>(null);

	onMount(() => {
		let destroyed = false;
		let elapsed = 0;

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
				const aura = shield;
				if (aura) {
					// предпросмотр повторяет попадание, чтобы искажение было видно.
					// Всё в секундах: decay — тоже.
					const sinceHit = elapsed % HIT_CYCLE;
					aura.state.hit = sinceHit < DECAY_SEC ? 1 - sinceHit / DECAY_SEC : 0;
					aura.state.hitDir = {
						x: Math.cos((elapsed / HIT_CYCLE) * Math.PI * 2),
						y: Math.sin((elapsed / HIT_CYCLE) * Math.PI * 2),
					};
					layer?.move(aura, {
						x: current?.x ?? 0,
						y: current?.y ?? 0,
						scale: SCALE,
					});
				}
				elapsed += dt;
				layer?.update(dt);
			});
		};

		void setup();

		return () => {
			destroyed = true;
			ship = null;
			shield = null;
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
			sprite.destroy();
			if (ship === sprite) ship = null;
		};
	});

	$effect(() => {
		const current = ship;
		if (!layer || !current) return;

		// Предпросмотр повторяет попадание, чтобы искажение щита было видно.
		const kind = shieldEnabled ? "shield" : null;
		if (!kind) return;

		const aura = createAura(kind, {
			x: current.x,
			y: current.y,
			scale: SCALE,
			rng: Math.random,
		});
		if (!aura) return;

		aura.state = {
			hp: CHARGES,
			max: SHIELD_MAX_HP,
			radius: Math.max(current.width, current.height) / 2,
			hit: 0,
			hitDir: { x: 0, y: -1 },
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
		if (!overchargeEnabled) return;

		const aura = createAura("overcharge", {
			x: current.x,
			y: current.y,
			scale: SCALE,
			rng: Math.random,
		});
		if (!aura) return;

		aura.state = { radius: Math.max(current.width, current.height) / 2 };
		layer.add(aura, { x: current.x, y: current.y, scale: SCALE });

		return () => {
			layer?.remove(aura);
		};
	});

	$effect(() => {
		const current = ship;
		if (!layer || !current) return;
		if (!armorCoatingEnabled) return;

		const coating = createCoating("ricochetium");
		if (!coating) return;
		layer.filter(current, coating);

		return () => {
			layer?.unfilter(current);
		};
	});
</script>

<div class="ship">
	Skin number: {skin + 1} <br />
	Shield: {shieldEnabled} <br />
	Armor: {armorCoatingEnabled} <br />
	Overcharge: {overchargeEnabled} <br />
	<div class="hero-scene" bind:this={container}>
		<canvas bind:this={canvas}></canvas>
	</div>
</div>

<style>
</style>
