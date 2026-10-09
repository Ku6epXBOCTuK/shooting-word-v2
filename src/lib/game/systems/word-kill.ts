import { STAR_TTL, VIEWER_HEIGHT } from "../config.js";
import type { SystemFactory } from "./types.js";

const STAR_HEAD_OFFSET = 20;

export const createWordKillSystem: SystemFactory = (ctx) => {
	const killed = ctx.world.with("word", "hitBy", "expired", "position");
	const viewers = ctx.world.with("viewer", "position");

	return () => {
		for (const entity of killed) {
			ctx.world.add({
				position: { x: entity.position.x, y: entity.position.y },
				explosion: { age: 0 },
			});

			for (const viewer of viewers) {
				if (viewer.viewer.userId === entity.hitBy.shooterId) {
					viewer.xp = (viewer.xp ?? 0) + 1;
					ctx.viewersDirty = true;

					const halfHeight =
						(viewer.size?.height ?? VIEWER_HEIGHT * ctx.settings.viewerScale) /
						2;
					const startY = viewer.position.y - halfHeight - STAR_HEAD_OFFSET;
					ctx.world.add({
						position: { x: viewer.position.x, y: startY },
						star: { age: 0, ttl: STAR_TTL, startY },
					});
					break;
				}
			}
		}
	};
};
