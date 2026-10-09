import { dev } from "$app/env";
import {
	BATTERY_REWARD,
	REVIVE_REWARD,
	SHIELD_DURATION_MS,
	SHIELD_REWARD,
	type ActiveShield,
} from "#lib/features/rewards/config.js";
import type { StoredViewer } from "#lib/features/persistence/index.js";
import { REVIVE_MAX } from "#lib/game/config.js";
import { normalizeSettings } from "#lib/game/settings.js";
import { logger } from "#lib/logger.js";
import type { Broadcaster } from "./broadcasters/index.js";
import {
	subscribeAllRedemptions,
	type RedemptionEvent,
} from "./redemptions.js";
import { rewardIds } from "./reward-ids/index.js";
import { storage } from "./storage/index.js";
import { getApiClient } from "./twitch-auth.js";
import { viewers } from "./viewers/index.js";

export interface RewardEffect {
	key: string | null;
	userId: string;
	userName: string;
	rewardTitle: string;
}

export interface EffectPush {
	shields: ActiveShield[];
	effects: RewardEffect[];
}

export type EffectSubscriber = (push: EffectPush) => void;

const globalScope = globalThis as typeof globalThis & {
	__effectShields?: Map<string, Map<string, ActiveShield>>;
	__effectQueue?: Map<string, RewardEffect[]>;
	__effectsRegistered?: Set<string>;
	__effectSubscribers?: Map<string, Set<EffectSubscriber>>;
};

const shields = (globalScope.__effectShields ??= new Map());
const queues = (globalScope.__effectQueue ??= new Map());
const registered = (globalScope.__effectsRegistered ??= new Set());
const subscribers = (globalScope.__effectSubscribers ??= new Map());

export function subscribeEffects(
	broadcasterId: string,
	subscriber: EffectSubscriber,
): () => void {
	let set = subscribers.get(broadcasterId);
	if (!set) {
		set = new Set();
		subscribers.set(broadcasterId, set);
	}
	set.add(subscriber);
	return () => {
		set.delete(subscriber);
		if (set.size === 0) subscribers.delete(broadcasterId);
	};
}

export function hasEffectSubscribers(broadcasterId: string): boolean {
	return (subscribers.get(broadcasterId)?.size ?? 0) > 0;
}

function notifySubscribers(broadcasterId: string, push: EffectPush): void {
	const set = subscribers.get(broadcasterId);
	if (!set) return;
	for (const subscriber of set) {
		try {
			subscriber(push);
		} catch (error) {
			logger.warn(
				`[effects] subscriber push failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}

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

async function setRedemptionStatus(
	broadcaster: Broadcaster,
	rewardId: string,
	redemptionId: string,
	status: "FULFILLED" | "CANCELED",
): Promise<void> {
	const api = await getApiClient(broadcaster);
	if (!api) return;

	try {
		await api.channelPoints.updateRedemptionStatusByIds(
			broadcaster.userId,
			rewardId,
			[redemptionId],
			status,
		);
	} catch (error) {
		logger.error(
			`[effects] failed to mark redemption ${status}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

function pendingCount(
	broadcasterId: string,
	key: string,
	userId: string,
): number {
	const queue = queues.get(broadcasterId) ?? [];
	return queue.filter(
		(effect: RewardEffect) => effect.key === key && effect.userId === userId,
	).length;
}

function storedCount(
	broadcasterId: string,
	userId: string,
	field: "batteries" | "revives",
): number {
	const stored = viewers
		.load<StoredViewer>(broadcasterId)
		.find((viewer) => viewer.userId === userId);
	return stored?.[field] ?? 0;
}

function grantShield(broadcaster: Broadcaster, event: RedemptionEvent): void {
	let shieldMap = shields.get(broadcaster.userId);
	if (!shieldMap) {
		shieldMap = new Map();
		shields.set(broadcaster.userId, shieldMap);
	}
	const shield: ActiveShield = {
		userId: event.userId,
		userName: event.userName,
		expiresAt: Date.now() + SHIELD_DURATION_MS,
	};
	shieldMap.set(event.userId, shield);
	notifySubscribers(broadcaster.userId, { shields: [shield], effects: [] });
	logger.info(
		`[effects] ${event.userName} got shield for ${SHIELD_DURATION_MS / 60_000} min (${broadcaster.login})`,
	);
}

function queueEffect(
	broadcaster: Broadcaster,
	key: string | null,
	event: RedemptionEvent,
): void {
	const effect: RewardEffect = {
		key,
		userId: event.userId,
		userName: event.userName,
		rewardTitle: event.rewardTitle,
	};
	if (hasEffectSubscribers(broadcaster.userId)) {
		notifySubscribers(broadcaster.userId, { shields: [], effects: [effect] });
	} else {
		let queue = queues.get(broadcaster.userId);
		if (!queue) {
			queue = [];
			queues.set(broadcaster.userId, queue);
		}
		queue.push(effect);
	}
	logger.info(
		`[effects] ${event.userName} redeemed "${event.rewardTitle}" key=${key ?? "unknown"} (${broadcaster.login})`,
	);
}

async function handleRedemption(
	broadcaster: Broadcaster,
	event: RedemptionEvent & { rewardId: string },
): Promise<void> {
	const settings = normalizeSettings(
		storage.load(broadcaster.userId, "settings"),
		undefined,
		dev,
	);
	const key = keyForRewardId(broadcaster.userId, event.rewardId);

	const limit =
		key === BATTERY_REWARD.key
			? { max: settings.batteryMax, field: "batteries" as const }
			: key === REVIVE_REWARD.key
				? { max: REVIVE_MAX, field: "revives" as const }
				: undefined;

	if (limit && key !== null) {
		const total =
			storedCount(broadcaster.userId, event.userId, limit.field) +
			pendingCount(broadcaster.userId, key, event.userId);

		if (total >= limit.max) {
			if (settings.autoRefund) {
				await setRedemptionStatus(
					broadcaster,
					event.rewardId,
					event.id,
					"CANCELED",
				);
				logger.info(
					`[effects] refunded ${event.userName} "${event.rewardTitle}" - over limit (${broadcaster.login})`,
				);
				return;
			}

			logger.info(
				`[effects] ${event.userName} redeemed "${event.rewardTitle}" over limit, no refund (${broadcaster.login})`,
			);
		}
	}

	if (key === SHIELD_REWARD.key) {
		grantShield(broadcaster, event);
	} else {
		queueEffect(broadcaster, key, event);
	}

	if (settings.autoFulfillment && key !== null) {
		await setRedemptionStatus(
			broadcaster,
			event.rewardId,
			event.id,
			"FULFILLED",
		);
	}
}

export function ensureRewardEffects(broadcaster: Broadcaster): void {
	if (registered.has(broadcaster.userId)) return;
	registered.add(broadcaster.userId);

	subscribeAllRedemptions(broadcaster, (event) => {
		void handleRedemption(broadcaster, event);
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
