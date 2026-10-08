import { resolve } from "$app/paths";
import { rewards } from "#lib/features/rewards/index.js";
import { features } from "#lib/features/variant.js";

export interface CabinetSession {
	login: string;
	displayName: string;
	widgetUuid: string | null;
	rewardsAuthorized: boolean;
	rewardsStatus: string | null;
}

export async function loadSession(): Promise<CabinetSession | null> {
	const response = await fetch(resolve("/api/broadcaster"));
	if (!response.ok) return null;

	const data = (await response.json()) as {
		login: string;
		displayName?: string | null;
		widgetUuid?: string;
	};

	let rewardsAuthorized = false;
	let rewardsStatus: string | null = null;

	if (features.rewards) {
		const status = await rewards.status();
		rewardsAuthorized = status.available;
		rewardsStatus = status.available
			? "Twitch авторизован, награды доступны"
			: (status.reason ?? "награды недоступны");
	}

	return {
		login: data.login,
		displayName: data.displayName ?? data.login,
		widgetUuid: data.widgetUuid ?? null,
		rewardsAuthorized,
		rewardsStatus,
	};
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

	return action === "create"
		? result.created.length > 0
			? `Созданы: ${result.created.join(", ")}`
			: "Все награды уже существуют"
		: `Удалено наград: ${result.deleted}`;
}
