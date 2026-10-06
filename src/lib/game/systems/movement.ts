import type { SystemFactory } from "./types.js";

export const createMovementSystem: SystemFactory = (ctx) => {
	const moving = ctx.world.with("position", "velocity");

	return (dt) => {
		for (const entity of moving) {
			entity.position.x += entity.velocity.x * dt;
			entity.position.y += entity.velocity.y * dt;
		}
	};
};
