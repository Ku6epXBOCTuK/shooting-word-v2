import {
	VIEWER_GROUND_MARGIN,
	VIEWER_HEIGHT,
	VIEWER_WIDTH,
	WALK_MAX_SPEED,
	WALK_MAX_TURN_TIME,
	WALK_MIN_SPEED,
	WALK_MIN_TURN_TIME,
} from "../config.js";
import { SESSIONPHASE } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createRoundResetSystem: SystemFactory = (ctx) => {
	const sessions = ctx.world.with("session");
	const viewers = ctx.world.with("viewer", "position", "walker", "hp");

	let lastPhase: string | null = null;

	return () => {
		for (const entity of sessions) {
			const phase = entity.session.phase;
			if (phase === lastPhase) continue;
			lastPhase = phase;
			if (phase !== SESSIONPHASE.STARTING) continue;

			const { width, height } = ctx.screen;

			for (const viewer of viewers) {
				for (const component of ["dead", "respawning", "timedOut"] as const) {
					if (viewer[component] !== undefined) {
						ctx.world.removeComponent(viewer, component);
					}
				}

				viewer.hp.current = viewer.hp.max;

				const halfWidth =
					(viewer.size?.width ?? VIEWER_WIDTH * ctx.settings.viewerScale) / 2;
				const halfHeight =
					(viewer.size?.height ?? VIEWER_HEIGHT * ctx.settings.viewerScale) / 2;
				viewer.position.x =
					halfWidth + ctx.rng() * Math.max(1, width - halfWidth * 2);
				viewer.position.y = height - VIEWER_GROUND_MARGIN - halfHeight;

				viewer.walker.direction = ctx.rng() < 0.5 ? -1 : 1;
				viewer.walker.speed =
					WALK_MIN_SPEED + ctx.rng() * (WALK_MAX_SPEED - WALK_MIN_SPEED);
				viewer.walker.timer =
					WALK_MIN_TURN_TIME +
					ctx.rng() * (WALK_MAX_TURN_TIME - WALK_MIN_TURN_TIME);
			}

			ctx.viewersDirty = true;
		}
	};
};
