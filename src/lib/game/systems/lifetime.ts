import type { SystemFactory } from "./types.js";

export const createLifetimeSystem: SystemFactory = (ctx) => {
	const living = ctx.world.with("lifetime").without("armed", "doomsdayed");
	const stops = ctx.world.with("timeStop");

	return (dt) => {
		if (stops.size > 0) return;

		for (const entity of living) {
			if (entity.timedOut) continue;

			entity.lifetime.age += dt;
			if (entity.lifetime.age >= entity.lifetime.ttl) {
				ctx.world.addComponent(entity, "timedOut", true);
			}
		}
	};
};
