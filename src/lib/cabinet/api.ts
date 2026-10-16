import { rewards } from "#lib/features/rewards/index.js";
import type {
	AppRewardStatus,
	RewardsImportResult,
} from "#lib/features/rewards/port.js";
import {
	normalizeRewards,
	type RewardSettings,
} from "#lib/features/rewards/settings.js";
import { REWARDS_ENABLED } from "#lib/features/variant.js";
import {
	defaultSettings,
	normalizeSettings,
	type GameSettings,
} from "#lib/game/settings.js";
import { dev } from "$app/env";
import { resolve } from "$app/paths";

export interface CabinetSession {
	login: string;
	displayName: string;
	widgetUuid: string | null;
	rewardsAuthorized: boolean;
	rewardsStatus: string | null;
	appRewards: AppRewardStatus[];
	settings: GameSettings;
	rewards: RewardSettings;
}

export async function loadSession(): Promise<CabinetSession | null> {
	if (!REWARDS_ENABLED) return null;

	const response = await fetch(resolve("/api/broadcaster"));
	if (!response.ok) return null;

	const data = (await response.json()) as {
		login: string;
		displayName?: string | null;
		widgetUuid?: string;
	};

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
		widgetUuid: data.widgetUuid ?? null,
		rewardsAuthorized,
		rewardsStatus,
		appRewards,
		settings: await loadSettings(),
		rewards: await loadRewards(),
	};
}

export async function loadSettings(): Promise<GameSettings> {
	try {
		const response = await fetch(resolve("/api/settings"));
		if (!response.ok) return defaultSettings();
		return normalizeSettings(await response.json(), undefined, dev);
	} catch {
		return defaultSettings();
	}
}

export async function saveSettings(settings: GameSettings): Promise<boolean> {
	try {
		const response = await fetch(resolve("/api/settings"), {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(settings),
		});
		return response.ok;
	} catch {
		return false;
	}
}

export async function loadRewards(): Promise<RewardSettings> {
	try {
		const response = await fetch(resolve("/api/reward-settings"));
		if (!response.ok) return {};
		return normalizeRewards(await response.json());
	} catch {
		return {};
	}
}

export async function saveRewards(rewards: RewardSettings): Promise<boolean> {
	try {
		const response = await fetch(resolve("/api/reward-settings"), {
			method: "PUT",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(rewards),
		});
		return response.ok;
	} catch {
		return false;
	}
}

export async function rotateWidgetUuid(): Promise<string | null> {
	const response = await fetch(resolve("/api/broadcaster"), {
		method: "POST",
	});
	if (!response.ok) return null;

	const data = (await response.json()) as { widgetUuid: string };
	return data.widgetUuid;
}

export async function updateAllRewards(): Promise<boolean> {
	const result = await rewards.updateAll();
	return result.ok;
}

export async function importReward(key: string): Promise<RewardsImportResult> {
	return rewards.importReward(key);
}

export async function updateReward(key: string): Promise<boolean> {
	const result = await rewards.update(key);
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

export async function deleteAllRewards(): Promise<boolean> {
	const result = await rewards.deleteAllRewards();
	return result.ok;
}
