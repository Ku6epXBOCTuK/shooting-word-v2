import {
	validateStored,
	type SettingDef,
	type SettingValue,
} from "#lib/game/settings.js";
import { dev } from "$app/env";
import { REWARD_CONFIGS } from "./config.js";
import type { RewardValues } from "./port.js";

export const REWARDS_SCHEMA = [
	{
		key: "title",
		param: "reward_title",
		label: "Название",
		type: "string",
		scope: "full",
		maxLength: 45,
		default: "",
		dev: false,
	},
	{
		key: "description",
		param: "description",
		label: "Описание",
		type: "string",
		scope: "full",
		maxLength: 200,
		default: "",
		dev: false,
	},
	{
		key: "cost",
		param: "cost",
		label: "Стоимость",
		type: "number",
		scope: "full",
		min: 1,
		max: 1_000_000,
		default: 100,
		dev: false,
	},
	{
		key: "cooldown",
		param: "cooldown",
		label: "Кулдаун, сек (0 — без кулдауна)",
		type: "number",
		scope: "full",
		min: 0,
		max: 604_800,
		default: 0,
		dev: false,
	},
] as const satisfies SettingDef[];

const DEV_TITLE_PREFIX = "Dev: ";

export function effectiveTitle(title: string): string {
	return dev ? `${DEV_TITLE_PREFIX}${title}` : title;
}

export function defaultRewardValues(key: string): RewardValues {
	const config = REWARD_CONFIGS.find((item) => item.key === key);
	if (!config) {
		throw new Error(`unknown reward key: ${key}`);
	}

	return {
		title: effectiveTitle(config.title),
		description: config.description,
		cost: config.cost,
		cooldown: config.cooldown,
	};
}

export function normalizeValues(raw: unknown): RewardValues | null {
	if (typeof raw !== "object" || raw === null) return null;

	const source = raw as Record<string, unknown>;
	const values: Record<string, SettingValue> = {};

	for (const def of REWARDS_SCHEMA) {
		const value = source[def.key];
		if (value === undefined) return null;

		const valid = validateStored(value, def);
		if (valid !== undefined) {
			values[def.key] = valid;
			continue;
		}

		// NOTE: an empty prompt is a valid reward state on Twitch, while the
		// shared string validator rejects empty strings.
		if (def.key === "description" && value === "") {
			values[def.key] = "";
			continue;
		}

		return null;
	}

	return values as unknown as RewardValues;
}
