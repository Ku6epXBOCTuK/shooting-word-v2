import type { SystemFactory } from "./types.js";

export const createRicochetiumSystem: SystemFactory = (ctx) => {
	const coated = ctx.world.with("ricochetium");

	return () => {
		const now = ctx.now();

		for (const entity of coated) {
			if (now >= entity.ricochetium.expiresAt) {
				ctx.world.removeComponent(entity, "ricochetium");
			}
		}
	};
};
