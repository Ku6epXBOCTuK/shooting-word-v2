import { resolve } from "$app/paths";
import { dev } from "$app/env";
import type { AppRewardStatus } from "#lib/features/rewards/port.js";
import { rewards } from "#lib/features/rewards/index.js";
import { REWARDS_ENABLED } from "#lib/features/variant.js";
import {
	defaultSettings,
	normalizeSettings,
	type GameSettings,
} from "#lib/game/settings.js";

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
	};
}

export async function loadSettings(): Promise<GameSettings> {
	try {
		const response = await fetch(
			resolve("/api/storage/[key]", { key: "settings" }),
		);
		if (!response.ok) return defaultSettings();
		return normalizeSettings(await response.json(), undefined, dev);
	} catch {
		return defaultSettings();
	}
}

export async function saveSettings(settings: GameSettings): Promise<boolean> {
	try {
		const response = await fetch(
			resolve("/api/storage/[key]", { key: "settings" }),
			{
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(settings),
			},
		);
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

export async function manageRewards(
	action: "create" | "delete",
): Promise<string> {
	const result =
		action === "create"
			? await rewards.createRewards()
			: await rewards.deleteAllRewards();

	if (!result.ok) {
		return result.reason ?? "ошибка";
	}

	if (action === "create") {
		const parts: string[] = [];
		if (result.created.length > 0) {
			parts.push(`Созданы: ${result.created.join(", ")}`);
		}
		if (result.updated && result.updated.length > 0) {
			parts.push(`Обновлены: ${result.updated.join(", ")}`);
		}
		return parts.length > 0 ? parts.join("; ") : "Все награды уже существуют";
	}

	return `Удалено наград: ${result.deleted}`;
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
