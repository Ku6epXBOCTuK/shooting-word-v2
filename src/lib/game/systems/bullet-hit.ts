import type { SystemFactory } from "./types.js";

export const createBulletHitSystem: SystemFactory = (ctx) => {
	const hits = ctx.world.with("bullet", "homing", "arrived", "position");

	return () => {
		for (const entity of hits) {
			const target = entity.homing.target;

			if (entity.bullet.miss) {
				ctx.world.add({
					position: { x: entity.position.x, y: entity.position.y },
					explosion: { age: 0 },
				});
				if (ctx.world.has(target)) {
					ctx.world.addComponent(target, "expired", true);
				}
			} else if (ctx.world.has(target) && !target.expired) {
				ctx.world.addComponent(target, "hitBy", {
					shooterId: entity.bullet.shooterId,
				});
				ctx.world.addComponent(target, "expired", true);
			}

			ctx.world.addComponent(entity, "expired", true);
		}
	};
};
