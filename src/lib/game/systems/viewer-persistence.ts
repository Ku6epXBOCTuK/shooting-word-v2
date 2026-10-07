import type { StoredViewer } from "#lib/features/persistence/index.js";
import type { SystemFactory } from "./types.js";

export const createViewerPersistenceSystem: SystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer");

	return () => {
		if (!ctx.viewersDirty) return;
		ctx.viewersDirty = false;

		const stored: StoredViewer[] = [];
		for (const entity of viewers) {
			stored.push({ ...entity.viewer, xp: entity.xp ?? 0 });
		}
		void ctx.viewerStore.save(stored);
	};
};
