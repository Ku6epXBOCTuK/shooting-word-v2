import type { SystemFactory } from "./types.js";

export const createLifetimeSystem: SystemFactory = (ctx) => {
	const living = ctx.world.with("lifetime");

	return (dt) => {
		for (const entity of living) {
			if (entity.expired) continue;

			entity.lifetime.age += dt;
			if (entity.lifetime.age >= entity.lifetime.ttl) {
				ctx.world.addComponent(entity, "expired", true);
			}
		}
	};
};
