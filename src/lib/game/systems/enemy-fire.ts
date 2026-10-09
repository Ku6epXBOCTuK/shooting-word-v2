import {
	ARMED_FUSE_MS,
	ENEMY_SHOT_HIT_DISTANCE,
	ENEMY_SHOT_SPEED,
} from "../config.js";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createEnemyFireSystem: SystemFactory = (ctx) => {
	const armed = ctx.world
		.with("word", "armed", "position")
		.without("hitBy")
		.without("expired");
	const viewers = ctx.world.with("viewer", "position", "hp").without("dead");

	const pickTarget = (): Entity | null => {
		if (viewers.size === 0) return null;

		let index = Math.floor(ctx.rng() * viewers.size);
		for (const viewer of viewers) {
			if (index === 0) return viewer;
			index--;
		}
		return null;
	};

	return () => {
		const now = ctx.now();

		for (const entity of armed) {
			if (now - entity.armed.enqueuedAt < ARMED_FUSE_MS) continue;

			const target = pickTarget();
			if (target) {
				const damage = ctx.rng() < ctx.settings.enemyDamageChance ? 1 : 0;
				ctx.world.add({
					position: { x: entity.position.x, y: entity.position.y },
					enemyShot: { damage },
					homing: {
						target,
						speed: ENEMY_SHOT_SPEED,
						hitDistance: ENEMY_SHOT_HIT_DISTANCE,
					},
				});
			}

			ctx.world.addComponent(entity, "expired", true);
		}
	};
};
