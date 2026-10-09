import {
	VIEWER_GROUND_MARGIN,
	VIEWER_HEIGHT,
	VIEWER_WIDTH,
	WALK_EDGE_MARGIN,
	WALK_MAX_SPEED,
	WALK_MAX_TURN_TIME,
	WALK_MIN_SPEED,
	WALK_MIN_TURN_TIME,
} from "../config.js";
import type { SystemFactory } from "./types.js";

export const createWalkSystem: SystemFactory = (ctx) => {
	const walkers = ctx.world.with("walker", "position").without("dead");

	return (dt) => {
		const { width, height } = ctx.screen;

		for (const entity of walkers) {
			entity.walker.timer -= dt;

			if (entity.walker.timer <= 0) {
				entity.walker.direction = ctx.rng() < 0.5 ? -1 : 1;
				entity.walker.speed =
					WALK_MIN_SPEED + ctx.rng() * (WALK_MAX_SPEED - WALK_MIN_SPEED);
				entity.walker.timer =
					WALK_MIN_TURN_TIME +
					ctx.rng() * (WALK_MAX_TURN_TIME - WALK_MIN_TURN_TIME);
			}

			entity.position.x += entity.walker.direction * entity.walker.speed * dt;

			const halfWidth =
				(entity.size?.width ?? VIEWER_WIDTH * ctx.settings.viewerScale) / 2;
			const minX = halfWidth + WALK_EDGE_MARGIN;
			const maxX = Math.max(minX, width - halfWidth - WALK_EDGE_MARGIN);
			if (entity.position.x < minX) {
				entity.position.x = minX;
				entity.walker.direction = 1;
			} else if (entity.position.x > maxX) {
				entity.position.x = maxX;
				entity.walker.direction = -1;
			}

			const halfHeight =
				(entity.size?.height ?? VIEWER_HEIGHT * ctx.settings.viewerScale) / 2;
			entity.position.y = height - VIEWER_GROUND_MARGIN - halfHeight;
		}
	};
};
