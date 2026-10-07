import type { SystemFactory } from "./types.js";

export const createHomingSystem: SystemFactory = (ctx) => {
	const projectiles = ctx.world
		.with("homing", "position")
		.without("arrived", "expired");

	return (dt) => {
		for (const entity of projectiles) {
			const target = entity.homing.target;

			if (!ctx.world.has(target) || !target.position || target.expired) {
				ctx.world.addComponent(entity, "expired", true);
				continue;
			}

			const dx = target.position.x - entity.position.x;
			const dy = target.position.y - entity.position.y;
			const distance = Math.hypot(dx, dy);
			const step = entity.homing.speed * dt;

			if (distance <= Math.max(step, entity.homing.hitDistance)) {
				ctx.world.addComponent(entity, "arrived", true);
				continue;
			}

			entity.position.x += (dx / distance) * step;
			entity.position.y += (dy / distance) * step;
		}
	};
};
