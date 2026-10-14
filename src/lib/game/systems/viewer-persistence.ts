import { SESSIONPHASE } from "../types.js";
import { captureProfile } from "../profiles.js";
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

		// Список собирается только после чтения базы: сохранение не может
		// обогнать загрузку и записать неполный список поверх полного.
		// restoreViewers подписался на тот же промис раньше и успевает
		// наполнить профили первым.
		void ctx.viewerStore.load().then(() => {
			// «профили + текущие корабли»: протухшие и вышедшие зрители
			// остаются в списке, пока жив их профиль.
			for (const entity of viewers) {
				captureProfile(ctx, entity);
			}
			void ctx.viewerStore.save([...ctx.viewerProfiles.values()]);
		});
	};
};
