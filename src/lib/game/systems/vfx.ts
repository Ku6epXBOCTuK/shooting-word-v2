import type { SystemFactory } from "./types.js";

// NOTE: age/ttl are only a timer; the render system sets ttl on creation.
// This system only ages reactions and flags expired, which cleanupSystem removes.
export const createVfxSystem: SystemFactory = (ctx) => {
	const reactions = ctx.world.with("vfx");

	return (dt) => {
		for (const entity of reactions) {
			entity.vfx.age += dt;
			if (entity.vfx.age >= entity.vfx.ttl) {
				ctx.world.addComponent(entity, "expired", true);
			}
		}
	};
};
