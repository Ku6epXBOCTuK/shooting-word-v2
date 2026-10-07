import { VIEWER_PLATE_PADDING } from "../config.js";
import type { SystemFactory } from "./types.js";

export const createMeasureSystem: SystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer", "sprite");

	return () => {
		for (const entity of viewers) {
			entity.size = {
				width:
					Math.max(entity.sprite.width, entity.view?.width ?? 0) +
					VIEWER_PLATE_PADDING * 2,
				height: entity.sprite.height,
			};
		}
	};
};
