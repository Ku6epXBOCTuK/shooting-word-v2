import { logger } from "#lib/logger.js";
import type { With } from "miniplex";
import { VIEWER_TIMEOUT_MS } from "../config.js";
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
		const expired: With<Entity, "viewer">[] = [];

		for (const entity of viewers) {
			if (now - entity.viewer.lastSeen > VIEWER_TIMEOUT_MS) {
				expired.push(entity);
			}
		}

		if (expired.length === 0) return;

		for (const entity of expired) {
			logger.info(
				`[viewer-timeout] removing ${entity.viewer.user} (${entity.viewer.userId}), idle ${Math.round((now - entity.viewer.lastSeen) / 3_600_000)}h`,
			);
			ctx.world.remove(entity);
		}
		ctx.viewersDirty = true;
	};
};
