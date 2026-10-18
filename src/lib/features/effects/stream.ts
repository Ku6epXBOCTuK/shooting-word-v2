import type { ConsumableSync } from "#lib/features/persistence/viewer-store.js";
import {
	BATTERY_REWARD,
	BEACON_REWARD,
	DOOMSDAY_REWARD,
	REVIVE_REWARD,
	TIME_STOP_REWARD,
} from "#lib/features/rewards/config.js";
import type {
	EffectsMessage,
	RewardEffect,
} from "#lib/features/rewards/effects.js";
import {
	effectsStream,
	rejectEffect,
} from "#lib/features/widget/widget.remote.js";
import type { bootstrapGame } from "#lib/game/bootstrap.js";
import { shouldReload } from "./version.js";

type GameApi = Awaited<ReturnType<typeof bootstrapGame>>;

type EffectsGame = Pick<
	GameApi,
	| "joinViewer"
	| "applyShields"
	| "applyOvercharges"
	| "applyArmorCoating"
	| "grantBatteries"
	| "grantRevives"
	| "grantBeacons"
	| "applyConsumables"
	| "doomsday"
	| "timeStop"
>;

export function applyEffects(
	game: EffectsGame,
	response: EffectsMessage,
	reject?: (effect: RewardEffect) => void,
): void {
	for (const shield of response.shields) {
		game.joinViewer({
			userId: shield.userId,
			user: shield.userName,
			login: shield.userName,
		});
	}
	game.applyShields(response.shields);

	for (const overcharge of response.overcharges ?? []) {
		game.joinViewer({
			userId: overcharge.userId,
			user: overcharge.userName,
			login: overcharge.userName,
		});
	}
	game.applyOvercharges(response.overcharges ?? []);

	for (const armorCoating of response.armorCoatings ?? []) {
		game.joinViewer({
			userId: armorCoating.userId,
			user: armorCoating.userName,
			login: armorCoating.userName,
		});
	}
	game.applyArmorCoating(response.armorCoatings ?? []);

	for (const effect of response.effects) {
		game.joinViewer({
			userId: effect.userId,
			user: effect.userName,
			login: effect.userName,
		});
	}

	const consumables: ConsumableSync[] = [];
	const legacyBatteries: string[] = [];
	const legacyRevives: string[] = [];
	const legacyBeacons: string[] = [];
	for (const effect of response.effects) {
		if (effect.counts) {
			consumables.push({ userId: effect.userId, ...effect.counts });
			continue;
		}
		if (effect.key === BATTERY_REWARD.key) legacyBatteries.push(effect.userId);
		if (effect.key === REVIVE_REWARD.key) legacyRevives.push(effect.userId);
		if (effect.key === BEACON_REWARD.key) legacyBeacons.push(effect.userId);
	}
	if (consumables.length > 0) {
		game.applyConsumables(consumables);
	}
	if (legacyBatteries.length > 0) {
		game.grantBatteries(legacyBatteries);
	}
	if (legacyRevives.length > 0) {
		game.grantRevives(legacyRevives);
	}
	if (legacyBeacons.length > 0) {
		game.grantBeacons(legacyBeacons);
	}

	for (const effect of response.effects) {
		if (effect.key === DOOMSDAY_REWARD.key) {
			const fired = game.doomsday(effect.userId);
			if (!fired) reject?.(effect);
		}
		if (effect.key === TIME_STOP_REWARD.key) {
			game.timeStop();
		}
	}
}

export function startEffectsStream(
	game: EffectsGame,
	uuid: string,
	key?: string,
): () => void {
	const reject = (effect: RewardEffect) => {
		if (!effect.redemptionId || !effect.rewardId) return;
		void rejectEffect({
			uuid,
			key,
			redemptionId: effect.redemptionId,
			rewardId: effect.rewardId,
			reason: "ship destroyed or doomsday already active",
		}).catch(() => {
			// NOTE: fire-and-forget; a failed reject leaves the redemption as is
		});
	};
	const iterator = effectsStream({ uuid })[Symbol.asyncIterator]();

	void (async () => {
		try {
			while (true) {
				const next = await iterator.next();
				if (next.done) return;
				if (shouldReload(next.value.version, __APP_COMMIT__)) {
					location.reload();
					return;
				}
				applyEffects(game, next.value, reject);
			}
		} catch {
			// NOTE: transport errors are transient and reconnected by the
			// framework; a terminal error (unknown widget) leaves nothing to apply
		}
	})();

	return () => {
		void iterator.return?.();
	};
}
