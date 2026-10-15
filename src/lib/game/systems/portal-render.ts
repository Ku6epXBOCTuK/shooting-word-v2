import { VIEWER_GROUND_MARGIN } from "../config.js";
import { createAura } from "../../vfx/registry.js";
import type { PortalAuraState, VfxStateful } from "../../vfx/types.js";
import type { System, RenderSystemFactory } from "./types.js";

const PORTAL_RADIUS = 32;

export const createPortalRenderSystem: RenderSystemFactory = (ctx) => {
	const portals = ctx.world.with("respawning", "position");
	const auras = new Map<object, VfxStateful<PortalAuraState>>();

	const groundY = () => ctx.app.screen.height - VIEWER_GROUND_MARGIN;

	const placement = (x: number) => ({
		x,
		y: groundY() - PORTAL_RADIUS,
		scale: ctx.settings.viewerScale,
	});

	const unsubscribeAdded = portals.onEntityAdded.subscribe((entity) => {
		const aura = createAura("portal", {
			...placement(entity.respawning.x),
			rng: ctx.rng,
		});
		if (!aura) return;
		auras.set(entity, aura);
		ctx.vfx.add(aura, placement(entity.respawning.x));
	});

	const unsubscribeRemoved = portals.onEntityRemoved.subscribe((entity) => {
		const aura = auras.get(entity);
		if (!aura) return;
		auras.delete(entity);
		ctx.vfx.remove(aura);
	});

	const system: System = () => {
		for (const entity of portals) {
			const aura = auras.get(entity);
			if (!aura) continue;
			const { elapsed, duration, x } = entity.respawning;
			aura.state = {
				progress: duration > 0 ? Math.min(1, elapsed / duration) : 1,
				groundY: groundY(),
			};
			ctx.vfx.move(aura, placement(x));
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const aura of auras.values()) {
			ctx.vfx.remove(aura);
		}
		auras.clear();
	};

	return system;
};
