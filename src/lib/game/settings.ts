import {
	BATTERY_HEAL_OTHER,
	BATTERY_HEAL_SELF,
	BATTERY_MAX,
	ENEMY_SHOT_DAMAGE_CHANCE,
	PRESSURE_SPAWN_SCALE_K,
	RESPAWN_DURATION,
	VIEWER_BASE_HP,
	VIEWER_SCALE,
	WORD_TTL,
} from "./config.js";

export type SettingScope = "static" | "full";
export type SettingValue = number | string | boolean;

interface BaseSettingDef {
	key: string;
	param: string;
	label: string;
	scope: SettingScope;
	dev: boolean;
}

interface NumberSettingDef extends BaseSettingDef {
	type: "number";
	min: number;
	max: number;
	step?: number;
	default: number;
}

interface BooleanSettingDef extends BaseSettingDef {
	type: "boolean";
	default: boolean;
}

interface StringSettingDef extends BaseSettingDef {
	type: "string";
	maxLength: number;
	default: string;
}

export type SettingDef =
	NumberSettingDef | BooleanSettingDef | StringSettingDef;

export type SettingTypeMap = {
	string: string;
	number: number;
	boolean: boolean;
};

// export interface SettingDef<K extends keyof TypeMapping> {
// 	key: string;
// 	param: string;
// 	label: string;
// 	type: K;
// 	scope: SettingScope;
// 	dev?: boolean;
// 	group?: string;
// 	min?: number;
// 	max?: number;
// 	step?: number;
// 	maxLength?: number;
// 	default: TypeMapping[K];
// }

// export interface GameSettings {
// 	viewerScale: number;
// 	viewerMisses: boolean;
// 	viewerBaseHp: number;
// 	enemyDamageChance: number;
// 	pressureSpawnK: number;
// 	wordTtl: number;
// 	batteryHeal: number;
// 	batteryHealOther: number;
// 	batteryMax: number;
// 	respawnDuration: number;
// }

type SettingEntry = (typeof SETTINGS_SCHEMA)[number];

export type GameSettings = {
	[
		Def in SettingEntry as Def extends { key: infer K extends string }
			? K
			: never
	]: Def extends { type: "number" }
		? number
		: Def extends { type: "boolean" }
			? boolean
			: string;
};

// export type GameSettings = {
// 	[K in SettingTypeMap as K["type"]]: K["default"];
// };

export const SETTINGS_SCHEMA = [
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
		dev: false,
	},
	{
		key: "viewerMisses",
		param: "viewer_misses",
		label: "Показывать промахи зрителей",
		type: "boolean",
		scope: "static",
		default: true,
		dev: false,
	},
	{
		key: "autoFulfillment",
		param: "auto_fulfillment",
		label: "Автосписание баллов за награды",
		type: "boolean",
		scope: "full",
		default: false,
		dev: false,
	},
	{
		key: "autoRefund",
		param: "auto_refund",
		label: "Авто-возврат баллов при активации сверх лимита",
		type: "boolean",
		scope: "full",
		default: true,
		dev: false,
	},
	{
		key: "viewerBaseHp",
		param: "viewer_base_hp",
		label: "Базовое hp зрителя",
		type: "number",
		scope: "full",
		dev: true,
		min: 1,
		max: 20,
		default: VIEWER_BASE_HP,
	},
	{
		key: "enemyDamageChance",
		param: "enemy_damage_chance",
		label: "Шанс урона вражеского выстрела",
		type: "number",
		scope: "full",
		dev: true,
		min: 0,
		max: 1,
		step: 0.05,
		default: ENEMY_SHOT_DAMAGE_CHANCE,
	},
	{
		key: "pressureSpawnK",
		param: "pressure_spawn_k",
		label: "Коэффициент давления спавна",
		type: "number",
		scope: "full",
		dev: true,
		min: 0,
		max: 3,
		step: 0.1,
		default: PRESSURE_SPAWN_SCALE_K,
	},
	{
		key: "wordTtl",
		param: "word_ttl",
		label: "Время жизни слова, сек",
		type: "number",
		scope: "full",
		dev: true,
		min: 5,
		max: 120,
		default: WORD_TTL,
	},
	{
		key: "batteryHeal",
		param: "battery_heal",
		label: "Лечение батареей себе, hp",
		type: "number",
		scope: "full",
		dev: true,
		min: 1,
		max: 10,
		default: BATTERY_HEAL_SELF,
	},
	{
		key: "batteryHealOther",
		param: "battery_heal_other",
		label: "Лечение батареей другому игроку, hp",
		type: "number",
		scope: "full",
		dev: true,
		min: 1,
		max: 10,
		default: BATTERY_HEAL_OTHER,
	},
	{
		key: "batteryMax",
		param: "battery_max",
		label: "Лимит батарей",
		type: "number",
		scope: "full",
		dev: true,
		min: 1,
		max: 20,
		default: BATTERY_MAX,
	},
	{
		key: "respawnDuration",
		param: "respawn_duration",
		label: "Длительность респавна, сек",
		type: "number",
		scope: "full",
		dev: true,
		min: 5,
		max: 120,
		default: RESPAWN_DURATION,
	},
] as const satisfies SettingDef[];

// for (const reward of REWARD_CONFIGS) {
// 	const group = `reward:${reward.key}`;
// 	SETTING_GROUPS[group] =
// 		reward.title.charAt(0).toUpperCase() + reward.title.slice(1);

// 	SETTINGS_SCHEMA.push(
// 		{
// 			key: `reward.${reward.key}.title`,
// 			param: `reward_${reward.key}_title`,
// 			label: "Название",
// 			type: "string",
// 			scope: "full",
// 			group,
// 			maxLength: 45,
// 			default: reward.title,
// 		},
// 		{
// 			key: `reward.${reward.key}.description`,
// 			param: `reward_${reward.key}_description`,
// 			label: "Описание",
// 			type: "string",
// 			scope: "full",
// 			group,
// 			maxLength: 200,
// 			default: reward.description,
// 		},
// 		{
// 			key: `reward.${reward.key}.cost`,
// 			param: `reward_${reward.key}_cost`,
// 			label: "Стоимость",
// 			type: "number",
// 			scope: "full",
// 			group,
// 			min: 1,
// 			max: 1_000_000,
// 			default: reward.cost,
// 		},
// 		{
// 			key: `reward.${reward.key}.cooldown`,
// 			param: `reward_${reward.key}_cooldown`,
// 			label: "Кулдаун, сек (0 — без кулдауна)",
// 			type: "number",
// 			scope: "full",
// 			group,
// 			min: 0,
// 			max: 604_800,
// 			default: reward.cooldown,
// 		},
// 	);
// }

export function defaultSettings(): GameSettings {
	const settings = {} as Partial<GameSettings>;
	for (const def of SETTINGS_SCHEMA) {
		(settings as Record<string, SettingValue>)[def.key] = def.default;
	}
	return settings as GameSettings;
}

const clamp = (value: number, def: NumberSettingDef): number =>
	Math.min(def.max ?? value, Math.max(def.min ?? value, value));

function coerce<T extends SettingDef>(
	raw: string,
	def: T,
): SettingTypeMap[T["type"]] | undefined {
	const currentDef = def as unknown as SettingDef;
	switch (currentDef.type) {
		case "number": {
			const value = Number(raw);
			if (!Number.isFinite(value)) return undefined;
			const clamped = clamp(value, def as NumberSettingDef);
			return clamped as unknown as SettingTypeMap[T["type"]];
		}
		case "boolean": {
			let result: boolean | undefined;
			if (raw === "1" || raw === "true") result = true;
			if (raw === "0" || raw === "false") result = false;
			return result as unknown as SettingTypeMap[T["type"]];
		}
		case "string": {
			const value = raw.slice(0, currentDef.maxLength ?? raw.length);
			const result = (value.length > 0
				? value
				: undefined) as unknown as SettingTypeMap[T["type"]];
			return result;
		}
	}
}

export function parseSettings(
	params: Pick<URLSearchParams, "get">,
	base: GameSettings = defaultSettings(),
	includeDev = false,
): GameSettings {
	const settings = { ...base };
	for (const def of SETTINGS_SCHEMA) {
		if (def.dev && !includeDev) continue;
		const raw = params.get(def.param);
		if (raw === null) continue;
		const value = coerce(raw, def);
		if (value !== undefined) {
			(settings as Record<string, SettingValue>)[def.key] = value;
		}
	}
	return settings;
}

export function serializeSettings(
	settings: GameSettings,
	scope?: SettingScope,
): URLSearchParams {
	const params = new URLSearchParams();
	for (const def of SETTINGS_SCHEMA) {
		if (def.dev) continue;
		if (scope && def.scope !== scope) continue;
		const value = settings[def.key];
		if (value === undefined || value === def.default) continue;
		params.set(def.param, String(value));
	}
	return params;
}

export function validateStored(
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
	includeDev = false,
): GameSettings {
	const settings = { ...base };
	if (typeof raw !== "object" || raw === null) return settings;

	for (const def of SETTINGS_SCHEMA) {
		if (def.dev && !includeDev) continue;
		const value = (raw as Record<string, unknown>)[def.key];
		if (value === undefined) continue;
		const valid = validateStored(value, def);
		if (valid !== undefined) {
			(settings as Record<string, SettingValue>)[def.key] = valid;
		}
	}
	return settings;
}
