import {
	mergeProfile,
	type StoredViewer,
} from "#lib/features/persistence/viewer-store.js";
import type { With } from "miniplex";
import type { GameContext } from "./context.js";
import type { Entity } from "./types.js";

/**
 * Переносит состояние корабля в профиль зрителя. Профиль живёт вне мира:
 * таймаут убирает сущность с экрана, но не стирает опыт, скин и расходники.
 * Боты в профили не попадают — им нечего сохранять.
 */
export function captureProfile(
	ctx: GameContext,
	entity: With<Entity, "viewer">,
): void {
	if (entity.viewer.bot) return;

	const profile: StoredViewer = {
		...entity.viewer,
		xp: entity.xp ?? 0,
		batteries: entity.batteries ?? 0,
		revives: entity.revives ?? 0,
		beacons: entity.beacons ?? 0,
	};
	ctx.viewerProfiles.set(
		entity.viewer.userId,
		mergeProfile(
			ctx.viewerProfiles.get(entity.viewer.userId),
			profile,
			ctx.now(),
		),
	);
}
