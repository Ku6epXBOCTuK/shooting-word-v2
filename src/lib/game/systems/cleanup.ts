import type { Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createCleanupSystem: SystemFactory = (ctx) => {
	const expired = ctx.world.with("expired");

	return () => {
		const toRemove: Entity[] = [];
		for (const entity of expired) {
			toRemove.push(entity);
		}
		for (const entity of toRemove) {
			ctx.world.remove(entity);
		}
	};
};
