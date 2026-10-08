import { BATTERY_REWARD } from "#lib/features/rewards/config.js";
import { logger } from "#lib/logger.js";
import type { Broadcaster } from "./broadcasters/index.js";
import { subscribeRedemptions } from "./redemptions.js";

export interface BatteryGrant {
	userId: string;
	userName: string;
}

const globalScope = globalThis as typeof globalThis & {
	__batteryGrants?: Map<string, BatteryGrant[]>;
	__batteriesRegistered?: Set<string>;
};

const pendingGrants = (globalScope.__batteryGrants ??= new Map());
const registered = (globalScope.__batteriesRegistered ??= new Set());

export function takeBatteryGrants(broadcasterId: string): BatteryGrant[] {
	const grants = pendingGrants.get(broadcasterId);
	if (!grants || grants.length === 0) return [];
	pendingGrants.set(broadcasterId, []);
	return grants;
}

export function ensureBatteryFeature(broadcaster: Broadcaster): void {
	if (registered.has(broadcaster.userId)) return;
	registered.add(broadcaster.userId);

	subscribeRedemptions(broadcaster, BATTERY_REWARD.key, (event) => {
		let grants = pendingGrants.get(broadcaster.userId);
		if (!grants) {
			grants = [];
			pendingGrants.set(broadcaster.userId, grants);
		}
		grants.push({ userId: event.userId, userName: event.userName });
		logger.info(
			`[batteries] ${event.userName} got battery (${broadcaster.login})`,
		);
	})
		.then((ok) => {
			if (!ok) registered.delete(broadcaster.userId);
		})
		.catch((error: unknown) => {
			registered.delete(broadcaster.userId);
			logger.error(
				`[batteries] registration failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		});
}
