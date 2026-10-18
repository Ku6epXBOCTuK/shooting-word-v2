import { rewards } from "#lib/features/rewards/index.js";
import type {
	AppRewardStatus,
	RewardValues,
} from "#lib/features/rewards/port.js";
import { REWARDS_ENABLED } from "#lib/features/variant.js";
import type { GameSettings } from "#lib/game/settings.js";
import {
	cabinetSession,
	rotateWidgetUuid as rotateWidgetUuidCommand,
	saveSettings as saveSettingsCommand,
} from "./cabinet.remote.js";

export interface CabinetSession {
	login: string;
	displayName: string;
	widgetUuid: string | null;
	rewardsAuthorized: boolean;
	rewardsStatus: string | null;
	appRewards: AppRewardStatus[];
	settings: GameSettings;
}

export async function loadSession(): Promise<CabinetSession | null> {
	if (!REWARDS_ENABLED) return null;

	const data = await cabinetSession().catch(() => null);
	if (!data) return null;

	let rewardsAuthorized = false;
	let rewardsStatus: string | null = null;
	let appRewards: AppRewardStatus[] = [];

	if (REWARDS_ENABLED) {
		const status = await rewards.status();
		rewardsAuthorized = status.available;
		rewardsStatus = status.available
			? "Twitch авторизован, награды доступны"
			: (status.reason ?? "награды недоступны");
		if (status.available) {
			appRewards = await rewards.listAppRewards();
		}
	}

	return {
		login: data.login,
		displayName: data.displayName ?? data.login,
		widgetUuid: data.widgetUuid,
		rewardsAuthorized,
		rewardsStatus,
		appRewards,
		settings: data.settings,
	};
}

export async function saveSettings(next: GameSettings): Promise<boolean> {
	try {
		await saveSettingsCommand(next);
		return true;
	} catch {
		return false;
	}
}

export async function rotateWidgetUuid(): Promise<string | null> {
	try {
		const data = await rotateWidgetUuidCommand();
		return data.widgetUuid;
	} catch {
		return null;
	}
}

export async function updateAllRewards(): Promise<boolean> {
	const result = await rewards.updateAll();
	return result.ok;
}

export async function updateReward(
	key: string,
	values: RewardValues,
): Promise<boolean> {
	const result = await rewards.update(key, values);
	return result.ok;
}

export async function toggleReward(
	key: string,
	enabled: boolean,
): Promise<boolean> {
	const result = await rewards.toggleReward(key, enabled);
	return result.ok;
}

export async function listAppRewards(): Promise<AppRewardStatus[]> {
	try {
		return await rewards.listAppRewards();
	} catch {
		return [];
	}
}

export async function deleteReward(
	key: string,
	refund: boolean,
): Promise<boolean> {
	const result = await rewards.deleteReward(key, refund);
	return result.ok;
}

export async function deleteAllRewards(refund: boolean): Promise<boolean> {
	const result = await rewards.deleteAllRewards(refund);
	return result.ok;
}
