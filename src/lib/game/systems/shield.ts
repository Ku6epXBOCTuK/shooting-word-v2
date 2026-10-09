import type { SystemFactory } from "./types.js";

export const createShieldSystem: SystemFactory = (ctx) => {
	const shielded = ctx.world.with("shield");

	return () => {
		const now = ctx.now();

		for (const entity of shielded) {
			if (now >= entity.shield.expiresAt) {
				ctx.world.removeComponent(entity, "shield");
			}
		}
	};
};
