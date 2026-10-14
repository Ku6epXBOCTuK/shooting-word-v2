import { VIEWER_HEIGHT } from "../config.js";
import { addReaction } from "../reaction.js";
import { bumpRoundStat } from "../round-stats.js";
import type { SystemFactory } from "./types.js";

const KILL_MARK_OFFSET = 20;

export const createWordKillSystem: SystemFactory = (ctx) => {
	const killed = ctx.world.with("word", "hitBy", "expired", "position");
	const viewers = ctx.world.with("viewer", "position");
	const sessions = ctx.world.with("session", "roundStats");

	return () => {
		for (const entity of killed) {
			addReaction(ctx, entity.position, "word-destroyed");

			for (const viewer of viewers) {
				if (viewer.viewer.userId === entity.hitBy.shooterId) {
					viewer.xp = (viewer.xp ?? 0) + 1;
					ctx.viewersDirty = true;

					for (const session of sessions) {
						bumpRoundStat(
							session.roundStats,
							"kills",
							viewer.viewer.userId,
							viewer.viewer.user,
						);
					}

					const halfHeight =
						(viewer.size?.height ?? VIEWER_HEIGHT * ctx.settings.viewerScale) /
						2;
					addReaction(
						ctx,
						{
							x: viewer.position.x,
							y: viewer.position.y - halfHeight - KILL_MARK_OFFSET,
						},
						"word-kill-mark",
					);
					break;
				}
			}
		}
	};
};
