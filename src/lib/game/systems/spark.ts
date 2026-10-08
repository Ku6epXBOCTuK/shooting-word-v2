import type { SystemFactory } from "./types.js";

export const createSparkSystem: SystemFactory = (ctx) => {
	const sparks = ctx.world.with("spark", "position");

	return (dt) => {
		for (const entity of sparks) {
			entity.spark.age += dt;
			if (entity.spark.age >= entity.spark.ttl) {
				ctx.world.addComponent(entity, "expired", true);
				continue;
			}

			entity.position.x += entity.spark.vx * dt;
			entity.position.y += entity.spark.vy * dt;
		}
	};
};
