import { BULLET_HIT_DISTANCE } from "../config.js";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createBulletSystem: SystemFactory = (ctx) => {
	const bullets = ctx.world.with("bullet", "position");

	return (dt) => {
		const toRemove: Entity[] = [];

		for (const entity of bullets) {
			const target = entity.bullet.target;

			if (!ctx.world.has(target) || !target.position) {
				toRemove.push(entity);
				continue;
			}

			const dx = target.position.x - entity.position.x;
			const dy = target.position.y - entity.position.y;
			const distance = Math.hypot(dx, dy);
			const step = entity.bullet.speed * dt;

			if (distance <= Math.max(step, BULLET_HIT_DISTANCE)) {
				toRemove.push(target, entity);
				continue;
			}

			entity.position.x += (dx / distance) * step;
			entity.position.y += (dy / distance) * step;
		}

		for (const entity of toRemove) {
			if (ctx.world.has(entity)) {
				ctx.world.remove(entity);
			}
		}
	};
};
