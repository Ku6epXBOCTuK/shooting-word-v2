import {
	SHIELD_DURATION_MS,
	SHIELD_REWARD,
	type ActiveShield,
} from "#lib/features/rewards/config.js";
import { logger } from "#lib/logger.js";
import { subscribeRedemptions } from "./redemptions.js";

interface ShieldsState {
	activeShields: Map<string, number>;
	registered: boolean;
}

const globalScope = globalThis as typeof globalThis & {
	__shieldsState?: ShieldsState;
};

const state = (globalScope.__shieldsState ??= {
	activeShields: new Map(),
	registered: false,
});

export function getActiveShields(): ActiveShield[] {
	const now = Date.now();
	const result: ActiveShield[] = [];

	for (const [userId, expiresAt] of state.activeShields) {
		if (expiresAt > now) {
			result.push({ userId, expiresAt });
		} else {
			state.activeShields.delete(userId);
		}
	}

	return result;
}

export function activateShield(userId: string): void {
	state.activeShields.set(userId, Date.now() + SHIELD_DURATION_MS);
}

export function ensureShieldFeature(): void {
	if (state.registered) return;
	state.registered = true;

	subscribeRedemptions(SHIELD_REWARD.key, (event) => {
		activateShield(event.userId);
		logger.info(
			`[shields] ${event.userName} got shield for ${SHIELD_DURATION_MS / 60_000} min`,
		);
	})
		.then((ok) => {
			if (!ok) state.registered = false;
		})
		.catch((error: unknown) => {
			state.registered = false;
			logger.error(
				`[shields] registration failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		});
}
