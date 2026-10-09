import { VIEWER_WIDTH, WALK_EDGE_MARGIN } from "../config.js";
import { SESSIONPHASE } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createRespawnSchedulerSystem: SystemFactory = (ctx) => {
	const sessions = ctx.world.with("session");
	const dead = ctx.world.with("viewer", "dead").without("respawning");

	return () => {
		let idle = false;
		for (const entity of sessions) {
			idle = entity.session.phase === SESSIONPHASE.IDLE;
		}
		if (!idle) return;

		const { width } = ctx.screen;

		for (const entity of dead) {
			const halfWidth =
				(entity.size?.width ?? VIEWER_WIDTH * ctx.settings.viewerScale) / 2;
			const minX = halfWidth + WALK_EDGE_MARGIN;
			const maxX = Math.max(minX, width - halfWidth - WALK_EDGE_MARGIN);
			const x = minX + ctx.rng() * (maxX - minX);

			ctx.world.addComponent(entity, "respawning", {
				elapsed: 0,
				duration: ctx.settings.respawnDuration,
				x,
			});
		}
	};
};
