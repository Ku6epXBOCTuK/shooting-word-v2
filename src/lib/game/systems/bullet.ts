import { BULLET_HIT_DISTANCE, STAR_TTL, VIEWER_HEIGHT } from "../config.js";
import { persistViewers } from "../persistence.js";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

const STAR_HEAD_OFFSET = 20;

export const createBulletSystem: SystemFactory = (ctx) => {
	const bullets = ctx.world.with("bullet", "position");
	const viewers = ctx.world.with("viewer", "position");

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
				ctx.world.add({
					position: { x: target.position.x, y: target.position.y },
					explosion: { age: 0 },
				});

				for (const viewer of viewers) {
					if (viewer.viewer.userId === entity.bullet.shooterId) {
						viewer.xp = (viewer.xp ?? 0) + 1;
						persistViewers(ctx.world);

						const startY =
							viewer.position.y - VIEWER_HEIGHT / 2 - STAR_HEAD_OFFSET;
						ctx.world.add({
							position: { x: viewer.position.x, y: startY },
							star: { age: 0, ttl: STAR_TTL, startY },
						});
						break;
					}
				}

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
