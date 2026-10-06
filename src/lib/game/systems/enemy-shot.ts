import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

const HIT_DISTANCE = 20;

export const createEnemyShotSystem: SystemFactory = (ctx) => {
	const shots = ctx.world.with("enemyShot", "position");

	return (dt) => {
		const toRemove: Entity[] = [];

		for (const entity of shots) {
			const target = entity.enemyShot.target;

			if (!ctx.world.has(target) || !target.position) {
				toRemove.push(entity);
				continue;
			}

			const dx = target.position.x - entity.position.x;
			const dy = target.position.y - entity.position.y;
			const distance = Math.hypot(dx, dy);
			const step = entity.enemyShot.speed * dt;

			if (distance <= Math.max(step, HIT_DISTANCE)) {
				if (target.hp) {
					target.hp.current = Math.max(
						0,
						target.hp.current - entity.enemyShot.damage,
					);
				}
				toRemove.push(entity);
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
