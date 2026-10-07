import { persistViewers } from "../persistence.js";
import type { SystemFactory } from "./types.js";

const SYNC_INTERVAL = 2;

export const createViewerPersistenceSystem: SystemFactory = (ctx) => {
	let timer = SYNC_INTERVAL;

	return (dt) => {
		timer -= dt;
		if (timer > 0) return;
		timer = SYNC_INTERVAL;
		persistViewers(ctx.world);
	};
};
