import type { SystemFactory } from "./types.js";

export const createOverchargeSystem: SystemFactory = (ctx) => {
	const overcharged = ctx.world.with("overcharge");

	return () => {
		const now = ctx.now();

		for (const entity of overcharged) {
			if (now >= entity.overcharge.expiresAt) {
				ctx.world.removeComponent(entity, "overcharge");
			}
		}
	};
};
