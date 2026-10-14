import type { SystemFactory } from "./types.js";

/**
 * Единственное место, где стареют отклики. Эффект сам объявляет свой срок
 * жизни, рендер кладёт его в `ttl` при создании — здесь только таймер и
 * метка `expired`, которую подберёт `cleanupSystem`.
 */
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
