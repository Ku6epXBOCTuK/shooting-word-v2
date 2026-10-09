import { resolve } from "$app/paths";
import {
	BATTERY_REWARD,
	REVIVE_REWARD,
	type ActiveShield,
} from "#lib/features/rewards/config.js";

interface RewardEffect {
	key: string | null;
	userId: string;
	userName: string;
}

interface EffectsResponse {
	shields: ActiveShield[];
	effects: RewardEffect[];
}

interface EffectsGame {
	joinViewer(identity: { userId: string; user: string }): void;
	applyShields(shields: ActiveShield[]): void;
	grantBatteries(userIds: string[]): void;
	grantRevives(userIds: string[]): void;
}

export function applyEffects(
	game: EffectsGame,
	response: EffectsResponse,
): void {
	for (const shield of response.shields) {
		game.joinViewer({ userId: shield.userId, user: shield.userName });
	}
	game.applyShields(response.shields);

	for (const effect of response.effects) {
		game.joinViewer({ userId: effect.userId, user: effect.userName });
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
}

export function startEffectsStream(
	game: EffectsGame,
	uuid: string,
): () => void {
	const source = new EventSource(
		`${resolve("/api/effects/stream")}?uuid=${encodeURIComponent(uuid)}`,
	);
	source.onmessage = (message: MessageEvent<string>) => {
		try {
			applyEffects(game, JSON.parse(message.data) as EffectsResponse);
		} catch {
			// malformed event - ignore, stream stays open
		}
	};
	return () => source.close();
}
