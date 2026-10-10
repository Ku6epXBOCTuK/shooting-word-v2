import { resolve } from "$app/paths";
import {
	BATTERY_REWARD,
	DOOMSDAY_REWARD,
	REVIVE_REWARD,
	TIME_STOP_REWARD,
	type ActiveOvercharge,
	type ActiveShield,
} from "#lib/features/rewards/config.js";

interface RewardEffect {
	key: string | null;
	userId: string;
	userName: string;
	redemptionId?: string;
	rewardId?: string;
}

interface EffectsResponse {
	shields: ActiveShield[];
	overcharges?: ActiveOvercharge[];
	effects: RewardEffect[];
}

interface EffectsGame {
	joinViewer(identity: { userId: string; user: string; login: string }): void;
	applyShields(shields: ActiveShield[]): void;
	applyOvercharges(overcharges: ActiveOvercharge[]): void;
	grantBatteries(userIds: string[]): void;
	grantRevives(userIds: string[]): void;
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

	for (const effect of response.effects) {
		game.joinViewer({
			userId: effect.userId,
			user: effect.userName,
			login: effect.userName,
		});
	}

	const batteryUserIds = response.effects
		.filter((effect) => effect.key === BATTERY_REWARD.key)
		.map((effect) => effect.userId);
	if (batteryUserIds.length > 0) {
		game.grantBatteries(batteryUserIds);
	}

	const reviveUserIds = response.effects
		.filter((effect) => effect.key === REVIVE_REWARD.key)
		.map((effect) => effect.userId);
	if (reviveUserIds.length > 0) {
		game.grantRevives(reviveUserIds);
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
): () => void {
	const reject = (effect: RewardEffect) => {
		if (!effect.redemptionId || !effect.rewardId) return;
		void fetch(
			`${resolve("/api/effects/reject")}?uuid=${encodeURIComponent(uuid)}`,
			{
				method: "POST",
				headers: { "content-type": "application/json" },
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
			applyEffects(game, JSON.parse(message.data) as EffectsResponse, reject);
		} catch {
			// malformed event - ignore, stream stays open
		}
	};
	return () => source.close();
}
