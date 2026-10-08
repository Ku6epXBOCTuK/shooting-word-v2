import {
	SHIELD_DURATION_MS,
	SHIELD_REWARD,
	type ActiveShield,
} from "#lib/features/rewards/config.js";
import { logger } from "#lib/logger.js";
import type { Broadcaster } from "./broadcasters/index.js";
import { subscribeRedemptions } from "./redemptions.js";

const globalScope = globalThis as typeof globalThis & {
	__activeShields?: Map<string, Map<string, ActiveShield>>;
	__shieldsRegistered?: Set<string>;
};

const activeShields = (globalScope.__activeShields ??= new Map());
const registered = (globalScope.__shieldsRegistered ??= new Set());

export function getActiveShields(broadcasterId: string): ActiveShield[] {
	const shields = activeShields.get(broadcasterId);
	if (!shields) return [];

	const now = Date.now();
	const result: ActiveShield[] = [];

	for (const [userId, shield] of shields) {
		if (shield.expiresAt > now) {
			result.push(shield);
		} else {
			shields.delete(userId);
		}
	}

	return result;
}

export function activateShield(
	broadcasterId: string,
	userId: string,
	userName: string,
): void {
	let shields = activeShields.get(broadcasterId);
	if (!shields) {
		shields = new Map();
		activeShields.set(broadcasterId, shields);
	}
	shields.set(userId, {
		userId,
		userName,
		expiresAt: Date.now() + SHIELD_DURATION_MS,
	});
}

export function ensureShieldFeature(broadcaster: Broadcaster): void {
	if (registered.has(broadcaster.userId)) return;
	registered.add(broadcaster.userId);

	subscribeRedemptions(broadcaster, SHIELD_REWARD.key, (event) => {
		activateShield(broadcaster.userId, event.userId, event.userName);
		logger.info(
			`[shields] ${event.userName} got shield for ${SHIELD_DURATION_MS / 60_000} min (${broadcaster.login})`,
		);
	})
		.then((ok) => {
			if (!ok) registered.delete(broadcaster.userId);
		})
		.catch((error: unknown) => {
			registered.delete(broadcaster.userId);
			logger.error(
				`[shields] registration failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		});
}
