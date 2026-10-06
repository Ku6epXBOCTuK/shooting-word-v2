import { STAR_RISE } from "../config.js";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createStarSystem: SystemFactory = (ctx) => {
	const stars = ctx.world.with("star", "position");

	return (dt) => {
		const expired: Entity[] = [];

		for (const entity of stars) {
			entity.star.age += dt;

			const t = Math.min(1, entity.star.age / entity.star.ttl);
			const eased = 1 - Math.pow(1 - t, 3);
			entity.position.y = entity.star.startY - eased * STAR_RISE;

			if (entity.star.age >= entity.star.ttl) {
				expired.push(entity);
			}
		}

		for (const entity of expired) {
			ctx.world.remove(entity);
		}
	};
};
