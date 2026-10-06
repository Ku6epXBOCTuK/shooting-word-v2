import { VIEWER_TIMEOUT_MS } from "../config.js";
import { persistViewers } from "../persistence.js";
import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

const CHECK_INTERVAL = 1;

export const createViewerTimeoutSystem: SystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer");
	let timer = 0;

	return (dt) => {
		timer -= dt;
		if (timer > 0) return;
		timer = CHECK_INTERVAL;

		const now = Date.now();
		const expired: Entity[] = [];

		for (const entity of viewers) {
			if (now - entity.viewer.lastSeen > VIEWER_TIMEOUT_MS) {
				expired.push(entity);
			}
		}

		if (expired.length === 0) return;

		for (const entity of expired) {
			ctx.world.remove(entity);
		}
		persistViewers(ctx.world);
	};
};
