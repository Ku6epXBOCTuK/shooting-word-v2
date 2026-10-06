import {
	PLATFORM_HEIGHT,
	VIEWER_HEIGHT,
	VIEWER_WIDTH,
	WALK_MAX_SPEED,
	WALK_MAX_TURN_TIME,
	WALK_MIN_SPEED,
	WALK_MIN_TURN_TIME,
} from "../config.js";
import type { SystemFactory } from "./types.js";

export const createWalkSystem: SystemFactory = (ctx) => {
	const walkers = ctx.world.with("walker", "position");

	return (dt) => {
		const { width, height } = ctx.app.screen;

		for (const entity of walkers) {
			entity.walker.timer -= dt;

			if (entity.walker.timer <= 0) {
				entity.walker.direction = Math.random() < 0.5 ? -1 : 1;
				entity.walker.speed =
					WALK_MIN_SPEED + Math.random() * (WALK_MAX_SPEED - WALK_MIN_SPEED);
				entity.walker.timer =
					WALK_MIN_TURN_TIME +
					Math.random() * (WALK_MAX_TURN_TIME - WALK_MIN_TURN_TIME);
			}

			entity.position.x += entity.walker.direction * entity.walker.speed * dt;

			const halfWidth = VIEWER_WIDTH / 2;
			if (entity.position.x < halfWidth) {
				entity.position.x = halfWidth;
				entity.walker.direction = 1;
			} else if (entity.position.x > width - halfWidth) {
				entity.position.x = width - halfWidth;
				entity.walker.direction = -1;
			}

			entity.position.y = height - PLATFORM_HEIGHT - VIEWER_HEIGHT / 2;
		}
	};
};
