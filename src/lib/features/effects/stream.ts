import type { ConsumableSync } from "#lib/features/persistence/viewer-store.js";
import {
	BATTERY_REWARD,
	BEACON_REWARD,
	DOOMSDAY_REWARD,
	REVIVE_REWARD,
	TIME_STOP_REWARD,
	type ActiveOvercharge,
	type ActiveArmorCoating,
	type ActiveShield,
} from "#lib/features/rewards/config.js";
import { resolve } from "$app/paths";
import { shouldReload } from "./version.js";

interface RewardEffect {
	key: string | null;
	userId: string;
	userName: string;
	redemptionId?: string;
	rewardId?: string;
	counts?: Partial<Record<"batteries" | "revives" | "beacons", number>>;
}

interface EffectsResponse {
	shields: ActiveShield[];
	overcharges?: ActiveOvercharge[];
	armorCoatings?: ActiveArmorCoating[];
	effects: RewardEffect[];
	version?: string;
}

interface EffectsGame {
	joinViewer(identity: { userId: string; user: string; login: string }): void;
	applyShields(shields: ActiveShield[]): void;
	applyOvercharges(overcharges: ActiveOvercharge[]): void;
	applyArmorCoating(armorCoatings: ActiveArmorCoating[]): void;
	grantBatteries(userIds: string[]): void;
	grantRevives(userIds: string[]): void;
	grantBeacons(userIds: string[]): void;
	applyConsumables(entries: ConsumableSync[]): void;
	doomsday(userId: string): boolean;
	timeStop(): void;
}

export function applyEffects(
	game: EffectsGame,
	response: EffectsResponse,
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
		void fetch(
			`${resolve("/api/effects/reject")}?uuid=${encodeURIComponent(uuid)}`,
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
					...(key ? { "x-widget-key": key } : {}),
				},
				body: JSON.stringify({
					redemptionId: effect.redemptionId,
					rewardId: effect.rewardId,
					reason: "ship destroyed or doomsday already active",
				}),
			},
		);
	};
	const source = new EventSource(
		`${resolve("/api/effects/stream")}?uuid=${encodeURIComponent(uuid)}`,
	);
	source.onmessage = (message: MessageEvent<string>) => {
		try {
			const response = JSON.parse(message.data) as EffectsResponse;
			if (shouldReload(response.version, __APP_COMMIT__)) {
				location.reload();
				return;
			}
			applyEffects(game, response, reject);
		} catch {
			// NOTE: required comment for empty block
		}
	};
	return () => source.close();
}
