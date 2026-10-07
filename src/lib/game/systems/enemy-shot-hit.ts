import type { SystemFactory } from "./types.js";

export const createEnemyShotHitSystem: SystemFactory = (ctx) => {
	const hits = ctx.world.with("enemyShot", "homing", "arrived");

	return () => {
		for (const entity of hits) {
			const target = entity.homing.target;

			if (ctx.world.has(target) && !target.shield && target.hp) {
				target.hp.current = Math.max(
					0,
					target.hp.current - entity.enemyShot.damage,
				);
			}

			ctx.world.addComponent(entity, "expired", true);
		}
	};
};
