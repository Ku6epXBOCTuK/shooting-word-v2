import { resolve } from "$app/paths";
import {
	BATTERY_REWARD,
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
}

export function startEffectsPolling(
	getGame: () => EffectsGame | null,
	uuid: string,
	intervalMs: number,
): () => void {
	const poll = async () => {
		try {
			const response = await fetch(
				`${resolve("/api/effects")}?uuid=${encodeURIComponent(uuid)}`,
			);
			if (!response.ok) return;

			const body = (await response.json()) as EffectsResponse;
			const game = getGame();
			if (game) applyEffects(game, body);
		} catch {
			// endpoint unavailable — retry on next tick
		}
	};

	void poll();
	const timer = setInterval(() => void poll(), intervalMs);
	return () => clearInterval(timer);
}
