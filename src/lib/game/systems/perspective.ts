import { FOCAL } from "../config.js";
import type { Position3 } from "../types.js";
import type { SystemFactory } from "./types.js";

export function projectPoint(
	position3: Position3,
	screen: { width: number; height: number },
) {
	return {
		x: screen.width / 2 + (position3.x * FOCAL) / position3.z,
		y: screen.height / 2 + (position3.y * FOCAL) / position3.z,
		scale: FOCAL / position3.z,
	};
}

export const createPerspectiveSystem: SystemFactory = (ctx) => {
	const flying = ctx.world.with("position3", "position");

	return () => {
		for (const entity of flying) {
			const projected = projectPoint(entity.position3, ctx.app.screen);
			entity.position.x = projected.x;
			entity.position.y = projected.y;
			entity.scale = projected.scale;
		}
	};
};
