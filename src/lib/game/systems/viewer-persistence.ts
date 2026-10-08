import type { StoredViewer } from "#lib/features/persistence/index.js";
import { SESSIONPHASE } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createViewerPersistenceSystem: SystemFactory = (ctx) => {
	const sessions = ctx.world.with("session");
	const viewers = ctx.world.with("viewer");

	return () => {
		for (const entity of sessions) {
			const phase = entity.session.phase;
			if (phase === SESSIONPHASE.STARTING || phase === SESSIONPHASE.GAMEOVER) {
				return;
			}
		}

		if (!ctx.viewersDirty) return;
		ctx.viewersDirty = false;

		const stored: StoredViewer[] = [];
		for (const entity of viewers) {
			stored.push({
				...entity.viewer,
				xp: entity.xp ?? 0,
				batteries: entity.batteries ?? 0,
			});
		}
		void ctx.viewerStore.save(stored);
	};
};
