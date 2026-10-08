import {
	SHIELD_DURATION_MS,
	SHIELD_REWARD,
	type ActiveShield,
} from "#lib/features/rewards/config.js";
import { logger } from "#lib/logger.js";
import type { Broadcaster } from "./broadcasters/index.js";
import { subscribeAllRedemptions } from "./redemptions.js";
import { rewardIds } from "./reward-ids/index.js";

export interface RewardEffect {
	key: string | null;
	userId: string;
	userName: string;
	rewardTitle: string;
}

const globalScope = globalThis as typeof globalThis & {
	__effectShields?: Map<string, Map<string, ActiveShield>>;
	__effectQueue?: Map<string, RewardEffect[]>;
	__effectsRegistered?: Set<string>;
};

const shields = (globalScope.__effectShields ??= new Map());
const queues = (globalScope.__effectQueue ??= new Map());
const registered = (globalScope.__effectsRegistered ??= new Set());

function keyForRewardId(
	broadcasterId: string,
	rewardId: string,
): string | null {
	for (const entry of rewardIds.list(broadcasterId)) {
		if (entry.rewardId === rewardId) return entry.key;
	}
	return null;
}

export function getRewardEffects(broadcasterId: string): {
	shields: ActiveShield[];
	effects: RewardEffect[];
} {
	const now = Date.now();
	const activeShields: ActiveShield[] = [];

	const shieldMap = shields.get(broadcasterId);
	if (shieldMap) {
		for (const [userId, shield] of shieldMap) {
			if (shield.expiresAt > now) {
				activeShields.push(shield);
			} else {
				shieldMap.delete(userId);
			}
		}
	}

	const effects = queues.get(broadcasterId) ?? [];
	queues.set(broadcasterId, []);

	return { shields: activeShields, effects };
}

export function ensureRewardEffects(broadcaster: Broadcaster): void {
	if (registered.has(broadcaster.userId)) return;
	registered.add(broadcaster.userId);

	subscribeAllRedemptions(broadcaster, (event) => {
		const key = keyForRewardId(broadcaster.userId, event.rewardId);

		if (key === SHIELD_REWARD.key) {
			let shieldMap = shields.get(broadcaster.userId);
			if (!shieldMap) {
				shieldMap = new Map();
				shields.set(broadcaster.userId, shieldMap);
			}
			shieldMap.set(event.userId, {
				userId: event.userId,
				userName: event.userName,
				expiresAt: Date.now() + SHIELD_DURATION_MS,
			});
			logger.info(
				`[effects] ${event.userName} got shield for ${SHIELD_DURATION_MS / 60_000} min (${broadcaster.login})`,
			);
			return;
		}

		let queue = queues.get(broadcaster.userId);
		if (!queue) {
			queue = [];
			queues.set(broadcaster.userId, queue);
		}
		queue.push({
			key,
			userId: event.userId,
			userName: event.userName,
			rewardTitle: event.rewardTitle,
		});
		logger.info(
			`[effects] ${event.userName} redeemed "${event.rewardTitle}" key=${key ?? "unknown"} (${broadcaster.login})`,
		);
	})
		.then((ok) => {
			if (!ok) registered.delete(broadcaster.userId);
		})
		.catch((error: unknown) => {
			registered.delete(broadcaster.userId);
			logger.error(
				`[effects] registration failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		});
}
