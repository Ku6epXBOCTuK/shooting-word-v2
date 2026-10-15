import {
	validateStored,
	type SettingDef,
	type SettingValue,
} from "#lib/game/settings.js";
import { dev } from "$app/env";
import { REWARD_CONFIGS, type REWARD_KEYS } from "./config.js";

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

/** Настраиваемые поля награды. Храним только оверрайды (дельты). */
export interface RewardOverrides {
	title?: string;
	description?: string;
	cost?: number;
	cooldown?: number;
}

export type RewardSettings = Partial<Record<REWARD_KEYS, RewardOverrides>>;

/** Полный набор значений всех наград из дефолтов `REWARD_CONFIGS`. */
export function defaultRewards(): Record<REWARD_KEYS, RewardOverrides> {
	const result = {} as Record<REWARD_KEYS, RewardOverrides>;
	for (const config of REWARD_CONFIGS) {
		result[config.key as REWARD_KEYS] = {
			title: config.title,
			description: config.description,
			cost: config.cost,
			cooldown: config.cooldown,
		};
	}
	return result;
}

/** Приводит сырые данные хранилища к оверрайдам, валидируя по `REWARDS_SCHEMA`. */
export function normalizeRewards(raw: unknown): RewardSettings {
	const result: RewardSettings = {};
	if (typeof raw !== "object" || raw === null) return result;

	const source = raw as Record<string, unknown>;
	for (const config of REWARD_CONFIGS) {
		const entry = source[config.key];
		if (typeof entry !== "object" || entry === null) continue;
		const fields = entry as Record<string, unknown>;

		const override: RewardOverrides = {};
		for (const def of REWARDS_SCHEMA) {
			const value = fields[def.key];
			if (value === undefined) continue;
			const valid = validateStored(value, def);
			if (valid !== undefined) {
				(override as Record<string, SettingValue>)[def.key] = valid;
			}
		}
		if (Object.keys(override).length > 0) {
			result[config.key as REWARD_KEYS] = override;
		}
	}
	return result;
}

export interface EffectiveReward {
	key: string;
	title: string;
	description: string;
	cost: number;
	cooldown: number;
}

const DEV_TITLE_PREFIX = "Dev: ";

export function effectiveTitle(title: string): string {
	return dev ? `${DEV_TITLE_PREFIX}${title}` : title;
}

/** Убирает dev-префикс с заголовка, подтянутого из Twitch. */
export function stripDevTitle(title: string): string {
	return title.startsWith(DEV_TITLE_PREFIX)
		? title.slice(DEV_TITLE_PREFIX.length)
		: title;
}

/**
 * Единственное место мержа дефолтов (`REWARD_CONFIGS`) и оверрайдов.
 * Мерж идёт поле-в-поле: `override ?? default`.
 */
export function effectiveRewards(rewards: RewardSettings): EffectiveReward[] {
	return REWARD_CONFIGS.map((config) => {
		const override = rewards[config.key as REWARD_KEYS] ?? {};
		return {
			key: config.key,
			title: effectiveTitle(override.title ?? config.title),
			cost: override.cost ?? config.cost,
			description: override.description ?? config.description,
			cooldown: override.cooldown ?? config.cooldown,
		};
	});
}
