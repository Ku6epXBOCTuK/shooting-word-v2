import type { SystemFactory } from "./types.js";

export const createRicochetSystem: SystemFactory = (ctx) => {
	const ricochets = ctx.world.with("ricochet", "position");

	return (dt) => {
		for (const entity of ricochets) {
			entity.ricochet.age += dt;
			if (entity.ricochet.age >= entity.ricochet.ttl) {
				ctx.world.addComponent(entity, "expired", true);
				continue;
			}

			entity.position.x += entity.ricochet.vx * dt;
			entity.position.y += entity.ricochet.vy * dt;
		}
	};
};
