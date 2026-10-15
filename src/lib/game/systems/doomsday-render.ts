import { VIEWER_HEIGHT } from "../config.js";
import { createAura } from "../../vfx/registry.js";
import { createDoomsdayBolt } from "../../vfx/auras.js";
import type { VfxItem, VfxStateful } from "../../vfx/types.js";
import type { DoomsdayAuraState } from "../../vfx/types.js";
import type { System, RenderSystemFactory } from "./types.js";

const BOLT_RADIUS = 4;

export const createDoomsdayRenderSystem: RenderSystemFactory = (ctx) => {
	const devices = ctx.world.with("doomsday", "position");
	const bolts = ctx.world.with("doomsdayBolt", "position");
	const viewers = ctx.world.with("viewer", "position").without("dead");

	const auras = new Map<object, VfxStateful<DoomsdayAuraState>>();
	const boltFx = new Map<object, VfxItem>();

	const placement = (x: number, y: number) => ({
		x,
		y,
		scale: ctx.settings.viewerScale,
	});

	const unsubscribeDeviceAdded = devices.onEntityAdded.subscribe((entity) => {
		const aura = createAura("doomsday", {
			...placement(entity.position.x, entity.position.y),
			rng: ctx.rng,
		});
		if (!aura) return;
		auras.set(entity, aura);
		ctx.vfx.add(aura, placement(entity.position.x, entity.position.y));
	});

	const unsubscribeDeviceRemoved = devices.onEntityRemoved.subscribe(
		(entity) => {
			const aura = auras.get(entity);
			if (!aura) return;
			auras.delete(entity);
			ctx.vfx.remove(aura);
		},
	);

	const unsubscribeBoltAdded = bolts.onEntityAdded.subscribe((entity) => {
		const effect = createDoomsdayBolt(BOLT_RADIUS);
		boltFx.set(entity, effect);
		ctx.vfx.add(effect, placement(entity.position.x, entity.position.y));
	});

	const unsubscribeBoltRemoved = bolts.onEntityRemoved.subscribe((entity) => {
		const effect = boltFx.get(entity);
		if (!effect) return;
		boltFx.delete(entity);
		ctx.vfx.remove(effect);
	});

	const system: System = () => {
		for (const entity of devices) {
			const aura = auras.get(entity);
			if (!aura) continue;

			const state = entity.doomsday;
			let shooter: DoomsdayAuraState["shooter"] = null;
			let shooterRadius = 0;
			for (const viewer of viewers) {
				if (viewer.viewer.userId !== state.shooterId) continue;
				shooter = { x: viewer.position.x, y: viewer.position.y };
				shooterRadius =
					(viewer.size?.height ?? VIEWER_HEIGHT * ctx.settings.viewerScale) / 2;
				break;
			}

			aura.state = {
				active: state.active,
				shooter,
				shooterRadius,
			};
			ctx.vfx.move(aura, placement(entity.position.x, entity.position.y));
		}

		for (const bolt of bolts) {
			const effect = boltFx.get(bolt);
			if (!effect) continue;
			ctx.vfx.move(effect, placement(bolt.position.x, bolt.position.y));
		}
	};

	system.dispose = () => {
		unsubscribeDeviceAdded();
		unsubscribeDeviceRemoved();
		unsubscribeBoltAdded();
		unsubscribeBoltRemoved();
		for (const aura of auras.values()) {
			ctx.vfx.remove(aura);
		}
		auras.clear();
		for (const effect of boltFx.values()) {
			ctx.vfx.remove(effect);
		}
		boltFx.clear();
	};

	return system;
};
