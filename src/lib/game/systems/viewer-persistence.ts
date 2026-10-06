import { VIEWER_TIMEOUT_MS } from "../config.js";
import { loadViewers, persistViewers } from "../persistence.js";
import { spawnViewer } from "../spawn.js";
import type { SystemFactory } from "./types.js";

const SYNC_INTERVAL = 2;

export const createViewerPersistenceSystem: SystemFactory = (ctx) => {
	const now = Date.now();

	for (const viewer of loadViewers()) {
		if (now - viewer.lastSeen < VIEWER_TIMEOUT_MS) {
			spawnViewer(ctx.world, viewer, ctx.app.screen, viewer.xp);
		}
	}

	let timer = SYNC_INTERVAL;

	return (dt) => {
		timer -= dt;
		if (timer > 0) return;
		timer = SYNC_INTERVAL;
		persistViewers(ctx.world);
	};
};
