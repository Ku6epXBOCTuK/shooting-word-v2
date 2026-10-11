import { dev } from "$app/env";
import {
	BATTERY_REWARD,
	BEACON_REWARD,
	OVERCHARGE_DURATION_MS,
	OVERCHARGE_REWARD,
	REWARD_CONFIGS,
	REVIVE_REWARD,
	RICOCHETIUM_DURATION_MS,
	RICOCHETIUM_REWARD,
	SHIELD_DURATION_MS,
	SHIELD_REWARD,
	TIME_STOP_REWARD,
	type ActiveOvercharge,
	type ActiveRicochetium,
	type ActiveShield,
} from "#lib/features/rewards/config.js";
import type {
	ConsumableField,
	StoredViewer,
} from "#lib/features/persistence/index.js";
import {
	BEACON_MAX,
	REVIVE_MAX,
	TIME_STOP_DURATION,
} from "#lib/game/config.js";
import { normalizeSettings, type GameSettings } from "#lib/game/settings.js";
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
	redemptionId: string;
	rewardId: string;
}

export interface EffectPush {
	shields: ActiveShield[];
	overcharges: ActiveOvercharge[];
	ricochetiums: ActiveRicochetium[];
	effects: RewardEffect[];
}

export type EffectSubscriber = (push: EffectPush) => void;

const globalScope = globalThis as typeof globalThis & {
	__effectShields?: Map<string, Map<string, ActiveShield>>;
	__effectOvercharges?: Map<string, Map<string, ActiveOvercharge>>;
	__effectRicochetiums?: Map<string, Map<string, ActiveRicochetium>>;
	__effectQueue?: Map<string, RewardEffect[]>;
	__effectsRegistered?: Set<string>;
	__effectSubscribers?: Map<string, Set<EffectSubscriber>>;
	__effectTimers?: Map<string, Map<string, number>>;
};

const shields = (globalScope.__effectShields ??= new Map());
const overcharges = (globalScope.__effectOvercharges ??= new Map());
const ricochetiums = (globalScope.__effectRicochetiums ??= new Map());
const queues = (globalScope.__effectQueue ??= new Map());
const registered = (globalScope.__effectsRegistered ??= new Set());
const subscribers = (globalScope.__effectSubscribers ??= new Map());
const timers = (globalScope.__effectTimers ??= new Map());

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
		if (
			entry.rewardId === rewardId &&
			REWARD_CONFIGS.some((config) => config.key === entry.key)
		) {
			return entry.key;
		}
	}
	return null;
}

export function getRewardEffects(broadcasterId: string): {
	shields: ActiveShield[];
	overcharges: ActiveOvercharge[];
	ricochetiums: ActiveRicochetium[];
	effects: RewardEffect[];
} {
	const now = Date.now();
	const activeShields: ActiveShield[] = [];
	const activeOvercharges: ActiveOvercharge[] = [];
	const activeRicochetiums: ActiveRicochetium[] = [];

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

	const overchargeMap = overcharges.get(broadcasterId);
	if (overchargeMap) {
		for (const [userId, overcharge] of overchargeMap) {
			if (overcharge.expiresAt > now) {
				activeOvercharges.push(overcharge);
			} else {
				overchargeMap.delete(userId);
			}
		}
	}

	const ricochetiumMap = ricochetiums.get(broadcasterId);
	if (ricochetiumMap) {
		for (const [userId, ricochetium] of ricochetiumMap) {
			if (ricochetium.expiresAt > now) {
				activeRicochetiums.push(ricochetium);
			} else {
				ricochetiumMap.delete(userId);
			}
		}
	}

	const effects = queues.get(broadcasterId) ?? [];
	queues.set(broadcasterId, []);

	return {
		shields: activeShields,
		overcharges: activeOvercharges,
		ricochetiums: activeRicochetiums,
		effects,
	};
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

async function cancelRedemption(
	broadcaster: Broadcaster,
	rewardId: string,
	redemptionId: string,
	settings: GameSettings,
	reason: string,
): Promise<boolean> {
	if (!settings.autoRefund) {
		logger.info(`[effects] ${reason}, no refund (${broadcaster.login})`);
		return false;
	}
	await setRedemptionStatus(broadcaster, rewardId, redemptionId, "CANCELED");
	logger.info(`[effects] refunded ${reason} (${broadcaster.login})`);
	return true;
}

export async function refundRedemption(
	broadcaster: Broadcaster,
	rewardId: string,
	redemptionId: string,
	reason: string,
): Promise<boolean> {
	const settings = normalizeSettings(
		storage.load(broadcaster.userId, "settings"),
		undefined,
		dev,
	);
	return cancelRedemption(
		broadcaster,
		rewardId,
		redemptionId,
		settings,
		reason,
	);
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
	field: ConsumableField,
): number {
	const stored = viewers
		.load<StoredViewer>(broadcasterId)
		.find((viewer) => viewer.userId === userId);
	return stored?.[field] ?? 0;
}

function queueEffect(
	broadcaster: Broadcaster,
	key: string | null,
	event: RedemptionEvent & { rewardId: string },
): void {
	const effect: RewardEffect = {
		key,
		userId: event.userId,
		userName: event.userName,
		rewardTitle: event.rewardTitle,
		redemptionId: event.id,
		rewardId: event.rewardId,
	};
	if (hasEffectSubscribers(broadcaster.userId)) {
		notifySubscribers(broadcaster.userId, {
			shields: [],
			overcharges: [],
			ricochetiums: [],
			effects: [effect],
		});
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

async function rejectRedemption(
	broadcaster: Broadcaster,
	event: RedemptionEvent & { rewardId: string },
	settings: GameSettings,
	reason: string,
): Promise<boolean> {
	return cancelRedemption(
		broadcaster,
		event.rewardId,
		event.id,
		settings,
		`${event.userName} "${event.rewardTitle}" - ${reason}`,
	);
}

type RewardEvent = RedemptionEvent & { rewardId: string };

interface CheckContext {
	storedCount(field: ConsumableField): number;
	pendingCount(key: string): number;
	effectActive(key: string): boolean;
	shieldActive(): boolean;
	overchargeActive(): boolean;
	ricochetiumActive(): boolean;
}

interface GrantContext {
	queueEffect(key: string): void;
	pushShield(shield: ActiveShield): void;
	pushOvercharge(overcharge: ActiveOvercharge): void;
	pushRicochetium(ricochetium: ActiveRicochetium): void;
	markActive(key: string, ttlMs: number): void;
}

interface RewardHandler {
	check?: (ctx: CheckContext, settings: GameSettings) => string | null;
	grant?: (ctx: GrantContext, event: RewardEvent) => void;
}

function overLimit(
	key: string,
	field: ConsumableField,
	max: (settings: GameSettings) => number,
): RewardHandler["check"] {
	return (ctx, settings) =>
		ctx.storedCount(field) + ctx.pendingCount(key) >= max(settings)
			? "over limit"
			: null;
}

const REWARD_HANDLERS: Record<string, RewardHandler> = {
	[BATTERY_REWARD.key]: {
		check: overLimit(
			BATTERY_REWARD.key,
			"batteries",
			(settings) => settings.batteryMax,
		),
	},
	[REVIVE_REWARD.key]: {
		check: overLimit(REVIVE_REWARD.key, "revives", () => REVIVE_MAX),
	},
	[BEACON_REWARD.key]: {
		check: overLimit(BEACON_REWARD.key, "beacons", () => BEACON_MAX),
	},
	[SHIELD_REWARD.key]: {
		check: (ctx) => (ctx.shieldActive() ? "shield already active" : null),
		grant: (ctx, event) =>
			ctx.pushShield({
				userId: event.userId,
				userName: event.userName,
				expiresAt: Date.now() + SHIELD_DURATION_MS,
			}),
	},
	[TIME_STOP_REWARD.key]: {
		check: (ctx) =>
			ctx.effectActive(TIME_STOP_REWARD.key)
				? "time stop already active"
				: null,
		grant: (ctx) => {
			ctx.markActive(TIME_STOP_REWARD.key, TIME_STOP_DURATION * 1000);
			ctx.queueEffect(TIME_STOP_REWARD.key);
		},
	},
	[OVERCHARGE_REWARD.key]: {
		check: (ctx) =>
			ctx.overchargeActive() ? "overcharge already active" : null,
		grant: (ctx, event) =>
			ctx.pushOvercharge({
				userId: event.userId,
				userName: event.userName,
				expiresAt: Date.now() + OVERCHARGE_DURATION_MS,
			}),
	},
	[RICOCHETIUM_REWARD.key]: {
		check: (ctx) =>
			ctx.ricochetiumActive() ? "ricochetium already active" : null,
		grant: (ctx, event) =>
			ctx.pushRicochetium({
				userId: event.userId,
				userName: event.userName,
				expiresAt: Date.now() + RICOCHETIUM_DURATION_MS,
			}),
	},
};

async function handleRedemption(
	broadcaster: Broadcaster,
	event: RewardEvent,
): Promise<void> {
	const settings = normalizeSettings(
		storage.load(broadcaster.userId, "settings"),
		undefined,
		dev,
	);
	const key = keyForRewardId(broadcaster.userId, event.rewardId);
	const handler = key !== null ? REWARD_HANDLERS[key] : undefined;

	const checkCtx: CheckContext = {
		storedCount: (field) =>
			storedCount(broadcaster.userId, event.userId, field),
		pendingCount: (effectKey) =>
			pendingCount(broadcaster.userId, effectKey, event.userId),
		effectActive: (effectKey) =>
			(timers.get(broadcaster.userId)?.get(effectKey) ?? 0) > Date.now(),
		shieldActive: () => {
			const shield = shields.get(broadcaster.userId)?.get(event.userId);
			return shield !== undefined && shield.expiresAt > Date.now();
		},
		overchargeActive: () => {
			const overcharge = overcharges.get(broadcaster.userId)?.get(event.userId);
			return overcharge !== undefined && overcharge.expiresAt > Date.now();
		},
		ricochetiumActive: () => {
			const ricochetium = ricochetiums
				.get(broadcaster.userId)
				?.get(event.userId);
			return ricochetium !== undefined && ricochetium.expiresAt > Date.now();
		},
	};

	const grantCtx: GrantContext = {
		queueEffect: (effectKey) => queueEffect(broadcaster, effectKey, event),
		pushShield: (shield) => {
			let shieldMap = shields.get(broadcaster.userId);
			if (!shieldMap) {
				shieldMap = new Map();
				shields.set(broadcaster.userId, shieldMap);
			}
			shieldMap.set(shield.userId, shield);
			notifySubscribers(broadcaster.userId, {
				shields: [shield],
				overcharges: [],
				ricochetiums: [],
				effects: [],
			});
			logger.info(
				`[effects] ${shield.userName} got shield for ${SHIELD_DURATION_MS / 60_000} min (${broadcaster.login})`,
			);
		},
		pushOvercharge: (overcharge) => {
			let overchargeMap = overcharges.get(broadcaster.userId);
			if (!overchargeMap) {
				overchargeMap = new Map();
				overcharges.set(broadcaster.userId, overchargeMap);
			}
			overchargeMap.set(overcharge.userId, overcharge);
			notifySubscribers(broadcaster.userId, {
				shields: [],
				overcharges: [overcharge],
				ricochetiums: [],
				effects: [],
			});
			logger.info(
				`[effects] ${overcharge.userName} got overcharge for ${OVERCHARGE_DURATION_MS / 60_000} min (${broadcaster.login})`,
			);
		},
		pushRicochetium: (ricochetium) => {
			let ricochetiumMap = ricochetiums.get(broadcaster.userId);
			if (!ricochetiumMap) {
				ricochetiumMap = new Map();
				ricochetiums.set(broadcaster.userId, ricochetiumMap);
			}
			ricochetiumMap.set(ricochetium.userId, ricochetium);
			notifySubscribers(broadcaster.userId, {
				shields: [],
				overcharges: [],
				ricochetiums: [ricochetium],
				effects: [],
			});
			logger.info(
				`[effects] ${ricochetium.userName} got ricochetium for ${RICOCHETIUM_DURATION_MS / 60_000} min (${broadcaster.login})`,
			);
		},
		markActive: (effectKey, ttlMs) => {
			let map = timers.get(broadcaster.userId);
			if (!map) {
				map = new Map();
				timers.set(broadcaster.userId, map);
			}
			map.set(effectKey, Date.now() + ttlMs);
		},
	};

	const reason = handler?.check?.(checkCtx, settings) ?? null;
	if (reason !== null) {
		const rejected = await rejectRedemption(
			broadcaster,
			event,
			settings,
			reason,
		);
		if (rejected) return;
	}

	if (handler?.grant) {
		handler.grant(grantCtx, event);
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
