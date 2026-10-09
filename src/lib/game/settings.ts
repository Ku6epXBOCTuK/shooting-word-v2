import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
import { VIEWER_SCALE } from "./config.js";

export type SettingValue = number | string | boolean;
export type SettingScope = "static" | "full";

export interface SettingDef {
	key: string;
	param: string;
	label: string;
	type: "number" | "string" | "boolean";
	scope: SettingScope;
	group?: string;
	min?: number;
	max?: number;
	step?: number;
	maxLength?: number;
	default: SettingValue;
}

export interface GameSettings {
	viewerScale: number;
	[key: string]: SettingValue;
}

export const SETTINGS_SCHEMA: SettingDef[] = [
	{
		key: "viewerScale",
		param: "viewer_scale",
		label: "Масштаб кораблей",
		type: "number",
		scope: "static",
		min: 0.5,
		max: 6,
		step: 0.5,
		default: VIEWER_SCALE,
	},
];

export const SETTING_GROUPS: Record<string, string> = {};

for (const reward of REWARD_CONFIGS) {
	const group = `reward:${reward.key}`;
	SETTING_GROUPS[group] =
		reward.title.charAt(0).toUpperCase() + reward.title.slice(1);

	SETTINGS_SCHEMA.push(
		{
			key: `reward.${reward.key}.title`,
			param: `reward_${reward.key}_title`,
			label: "Название",
			type: "string",
			scope: "full",
			group,
			maxLength: 45,
			default: reward.title,
		},
		{
			key: `reward.${reward.key}.cost`,
			param: `reward_${reward.key}_cost`,
			label: "Стоимость",
			type: "number",
			scope: "full",
			group,
			min: 1,
			max: 1_000_000,
			default: reward.cost,
		},
		{
			key: `reward.${reward.key}.cooldown`,
			param: `reward_${reward.key}_cooldown`,
			label: "Кулдаун, сек (0 — без кулдауна)",
			type: "number",
			scope: "full",
			group,
			min: 0,
			max: 604_800,
			default: reward.cooldown,
		},
	);
}

export function defaultSettings(): GameSettings {
	const settings: Record<string, SettingValue> = {};
	for (const def of SETTINGS_SCHEMA) {
		settings[def.key] = def.default;
	}
	return settings as GameSettings;
}

const clamp = (value: number, def: SettingDef): number =>
	Math.min(def.max ?? value, Math.max(def.min ?? value, value));

function coerce(raw: string, def: SettingDef): SettingValue | undefined {
	switch (def.type) {
		case "number": {
			const value = Number(raw);
			if (!Number.isFinite(value)) return undefined;
			return clamp(value, def);
		}
		case "boolean":
			if (raw === "1" || raw === "true") return true;
			if (raw === "0" || raw === "false") return false;
			return undefined;
		case "string": {
			const value = raw.slice(0, def.maxLength ?? raw.length);
			return value.length > 0 ? value : undefined;
		}
	}
}

export function parseSettings(
	params: Pick<URLSearchParams, "get">,
	base: GameSettings = defaultSettings(),
): GameSettings {
	const settings = { ...base };
	for (const def of SETTINGS_SCHEMA) {
		const raw = params.get(def.param);
		if (raw === null) continue;
		const value = coerce(raw, def);
		if (value !== undefined) settings[def.key] = value;
	}
	return settings;
}

export function serializeSettings(
	settings: GameSettings,
	scope?: SettingScope,
): URLSearchParams {
	const params = new URLSearchParams();
	for (const def of SETTINGS_SCHEMA) {
		if (scope && def.scope !== scope) continue;
		const value = settings[def.key];
		if (value === undefined || value === def.default) continue;
		params.set(def.param, String(value));
	}
	return params;
}

function validateStored(
	value: unknown,
	def: SettingDef,
): SettingValue | undefined {
	switch (def.type) {
		case "number":
			if (typeof value !== "number" || !Number.isFinite(value)) {
				return undefined;
			}
			return clamp(value, def);
		case "boolean":
			return typeof value === "boolean" ? value : undefined;
		case "string": {
			if (typeof value !== "string" || value.length === 0) return undefined;
			return value.slice(0, def.maxLength ?? value.length);
		}
	}
}

export function normalizeSettings(
	raw: unknown,
	base: GameSettings = defaultSettings(),
): GameSettings {
	const settings = { ...base };
	if (typeof raw !== "object" || raw === null) return settings;

	for (const def of SETTINGS_SCHEMA) {
		const value = (raw as Record<string, unknown>)[def.key];
		if (value === undefined) continue;
		const valid = validateStored(value, def);
		if (valid !== undefined) settings[def.key] = valid;
	}
	return settings;
}
