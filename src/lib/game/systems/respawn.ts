import type { SystemFactory } from "./types.js";

export const createRespawnSystem: SystemFactory = (ctx) => {
	const respawning = ctx.world.with("viewer", "respawning", "dead", "position");

	return (dt) => {
		for (const entity of respawning) {
			entity.respawning.elapsed += dt;
			if (entity.respawning.elapsed < entity.respawning.duration) continue;

			const x = entity.respawning.x;
			ctx.world.removeComponent(entity, "respawning");
			ctx.world.removeComponent(entity, "dead");
			if (entity.hp) {
				entity.hp.current = entity.hp.max;
				entity.hp.regenIn = undefined;
			}
			entity.position.x = x;
		}
	};
};
