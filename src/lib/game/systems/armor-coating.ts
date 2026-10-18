import type { SystemFactory } from "./types.js";

export const createArmorCoatingSystem: SystemFactory = (ctx) => {
	const coated = ctx.world.with("armorCoating");

	return () => {
		const now = ctx.now();

		for (const entity of coated) {
			if (now >= entity.armorCoating.expiresAt) {
				ctx.world.removeComponent(entity, "armorCoating");
			}
		}
	};
};
