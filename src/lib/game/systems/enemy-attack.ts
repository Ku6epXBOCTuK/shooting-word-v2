import type { SystemFactory } from "./types.js";

export const createEnemyAttackSystem: SystemFactory = (ctx) => {
	const timedOut = ctx.world
		.with("word", "expired", "position")
		.without("hitBy")
		.without("armed");

	return () => {
		const now = Date.now();
		for (const entity of timedOut) {
			ctx.world.addComponent(entity, "armed", { enqueuedAt: now });
			ctx.world.removeComponent(entity, "expired");
		}
	};
};
