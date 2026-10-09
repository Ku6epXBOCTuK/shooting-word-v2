import {
	VIEWER_HEIGHT,
	VIEWER_LABEL_FONT_SIZE,
	VIEWER_PLATE_PADDING,
	VIEWER_WIDTH,
} from "../config.js";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createMeasureSystem: SystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer");
	const measured = new WeakMap<Entity, { user: string; scale: number }>();

	return () => {
		const scale = ctx.settings.viewerScale;
		for (const entity of viewers) {
			const prev = measured.get(entity);
			if (prev && prev.user === entity.viewer.user && prev.scale === scale) {
				continue;
			}

			const label = ctx.measureText(entity.viewer.user, VIEWER_LABEL_FONT_SIZE);
			entity.size = {
				width:
					Math.max(VIEWER_WIDTH * scale, label.width) +
					VIEWER_PLATE_PADDING * 2,
				height: VIEWER_HEIGHT * scale,
			};
			measured.set(entity, { user: entity.viewer.user, scale });
		}
	};
};
