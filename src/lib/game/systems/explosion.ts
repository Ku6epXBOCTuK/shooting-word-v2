import { EXPLOSION_FRAME_DURATION, EXPLOSION_FRAME_LABELS } from "../config.js";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createExplosionSystem: SystemFactory = (ctx) => {
	const explosions = ctx.world.with("explosion");
	const duration = EXPLOSION_FRAME_LABELS.length * EXPLOSION_FRAME_DURATION;

	return (dt) => {
		const finished: Entity[] = [];

		for (const entity of explosions) {
			entity.explosion.age += dt;
			if (entity.explosion.age >= duration) {
				finished.push(entity);
			}
		}

		for (const entity of finished) {
			ctx.world.remove(entity);
		}
	};
};
