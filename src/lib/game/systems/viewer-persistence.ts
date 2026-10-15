import { captureProfile } from "../profiles.js";
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

		// NOTE: The profile list is built only after the store read: a save must not
		// overtake the load and overwrite the full list with a partial one.
		void ctx.viewerStore.load().then(() => {
			for (const entity of viewers) {
				captureProfile(ctx, entity);
			}
			void ctx.viewerStore.save([...ctx.viewerProfiles.values()]);
		});
	};
};
