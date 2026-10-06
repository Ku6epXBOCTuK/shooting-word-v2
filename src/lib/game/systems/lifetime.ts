import type { With } from "miniplex";
import { ENEMY_SHOT_DAMAGE, ENEMY_SHOT_SPEED } from "../config.js";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createLifetimeSystem: SystemFactory = (ctx) => {
	const living = ctx.world.with("lifetime", "position");
	const viewers = ctx.world.with("viewer", "position", "hp");

	const pickTarget = (): Entity | null => {
		if (viewers.size === 0) return null;

		let total = 0;
		for (const viewer of viewers) {
			total += Math.max(0, viewer.hp.current);
		}

		if (total === 0) {
			let index = Math.floor(Math.random() * viewers.size);
			for (const viewer of viewers) {
				if (index === 0) return viewer;
				index--;
			}
			return null;
		}

		let roll = Math.random() * total;
		for (const viewer of viewers) {
			roll -= Math.max(0, viewer.hp.current);
			if (roll <= 0) return viewer;
		}
		return null;
	};

	return (dt) => {
		const expired: With<Entity, "lifetime" | "position">[] = [];

		for (const entity of living) {
			entity.lifetime.age += dt;
			if (entity.lifetime.age >= entity.lifetime.ttl) {
				expired.push(entity);
			}
		}

		for (const entity of expired) {
			const target = pickTarget();

			if (target) {
				ctx.world.add({
					position: { x: entity.position.x, y: entity.position.y },
					enemyShot: {
						target,
						speed: ENEMY_SHOT_SPEED,
						damage: ENEMY_SHOT_DAMAGE,
					},
				});
			}

			ctx.world.remove(entity);
		}
	};
};
