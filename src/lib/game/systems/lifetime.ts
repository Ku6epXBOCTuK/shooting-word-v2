import type { With } from "miniplex";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createLifetimeSystem: SystemFactory = (ctx) => {
	const living = ctx.world.with("lifetime");

	return (dt) => {
		const expired: With<Entity, "lifetime">[] = [];

		for (const entity of living) {
			entity.lifetime.age += dt;
			if (entity.lifetime.age >= entity.lifetime.ttl) {
				expired.push(entity);
			}
		}

		for (const entity of expired) {
			ctx.world.remove(entity);
		}
	};
};
