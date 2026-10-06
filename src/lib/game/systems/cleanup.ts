import type { SystemFactory } from "./types.js";

export const createCleanupSystem: SystemFactory = (ctx) => {
	const words = ctx.world.with("word", "position");

	return () => {
		const { width, height } = ctx.app.screen;

		for (const entity of words) {
			const { x, y } = entity.position;
			if (x < -400 || x > width + 400 || y < -100 || y > height + 100) {
				ctx.world.remove(entity);
			}
		}
	};
};
