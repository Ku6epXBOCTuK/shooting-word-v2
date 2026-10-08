import { REVIVE_DELAY } from "../config.js";
import { SESSIONPHASE } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createReviveSystem: SystemFactory = (ctx) => {
	const sessions = ctx.world.with("session");
	const deadWithRevives = ctx.world
		.with("viewer", "dead", "position", "revives")
		.without("respawning");

	return () => {
		let playing = false;
		for (const entity of sessions) {
			playing = entity.session.phase === SESSIONPHASE.PLAYING;
		}
		if (!playing) return;

		for (const entity of deadWithRevives) {
			if ((entity.revives ?? 0) <= 0) continue;

			entity.revives -= 1;
			ctx.viewersDirty = true;
			ctx.world.addComponent(entity, "respawning", {
				elapsed: 0,
				duration: REVIVE_DELAY,
				x: entity.position.x,
			});
		}
	};
};
