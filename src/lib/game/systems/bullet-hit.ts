import { bumpRoundStat } from "../round-stats.js";
import type { SystemFactory } from "./types.js";

export const createBulletHitSystem: SystemFactory = (ctx) => {
	const hits = ctx.world.with("bullet", "homing", "arrived", "position");
	const viewers = ctx.world.with("viewer");
	const sessions = ctx.world.with("session", "roundStats");

	return () => {
		for (const entity of hits) {
			const target = entity.homing.target;

			if (entity.bullet.miss) {
				ctx.world.add({
					position: { x: entity.position.x, y: entity.position.y },
					explosion: { age: 0 },
				});
				for (const viewer of viewers) {
					if (viewer.viewer.userId !== entity.bullet.shooterId) continue;
					for (const session of sessions) {
						bumpRoundStat(
							session.roundStats,
							"misses",
							viewer.viewer.userId,
							viewer.viewer.user,
						);
					}
					break;
				}
				if (ctx.world.has(target)) {
					ctx.world.addComponent(target, "expired", true);
				}
			} else if (ctx.world.has(target) && !target.expired) {
				ctx.world.addComponent(target, "hitBy", {
					shooterId: entity.bullet.shooterId,
				});
				ctx.world.addComponent(target, "expired", true);
			}

			ctx.world.addComponent(entity, "expired", true);
		}
	};
};
