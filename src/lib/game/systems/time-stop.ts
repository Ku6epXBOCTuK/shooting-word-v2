import type { SystemFactory } from "./types.js";

export const createTimeStopSystem: SystemFactory = (ctx) => {
	const stops = ctx.world.with("timeStop");

	return (dt) => {
		for (const entity of stops) {
			entity.timeStop.elapsed += dt;
			if (entity.timeStop.elapsed >= entity.timeStop.duration) {
				ctx.world.addComponent(entity, "expired", true);
			}
		}
	};
};
