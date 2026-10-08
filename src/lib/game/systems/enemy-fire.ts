import {
	ACTIVE_FIRE_INTERVAL,
	ENEMY_SHOT_DAMAGE_CHANCE,
	ENEMY_SHOT_HIT_DISTANCE,
	ENEMY_SHOT_SPEED,
} from "../config.js";
import type { With } from "miniplex";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createEnemyFireSystem: SystemFactory = (ctx) => {
	const armed = ctx.world
		.with("word", "armed", "position")
		.without("hitBy")
		.without("expired");
	const viewers = ctx.world.with("viewer", "position", "hp").without("dead");

	let cooldown = 0;

	const pickTarget = (): Entity | null => {
		if (viewers.size === 0) return null;

		let index = Math.floor(Math.random() * viewers.size);
		for (const viewer of viewers) {
			if (index === 0) return viewer;
			index--;
		}
		return null;
	};

	return (dt) => {
		cooldown -= dt;
		if (cooldown > 0) return;

		let oldest: With<Entity, "armed" | "position"> | null = null;
		for (const entity of armed) {
			if (!oldest || entity.armed.enqueuedAt < oldest.armed.enqueuedAt) {
				oldest = entity;
			}
		}
		if (!oldest) {
			cooldown = 0;
			return;
		}

		cooldown = ACTIVE_FIRE_INTERVAL;

		const target = pickTarget();
		if (!target) return;

		const damage = Math.random() < ENEMY_SHOT_DAMAGE_CHANCE ? 1 : 0;
		ctx.world.add({
			position: { x: oldest.position.x, y: oldest.position.y },
			enemyShot: { damage },
			homing: {
				target,
				speed: ENEMY_SHOT_SPEED,
				hitDistance: ENEMY_SHOT_HIT_DISTANCE,
			},
		});
		ctx.world.addComponent(oldest, "expired", true);
	};
};
