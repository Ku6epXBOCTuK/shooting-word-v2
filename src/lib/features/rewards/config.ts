import { BATTERY_HEAL_OTHER, BATTERY_HEAL_SELF } from "#lib/game/config.js";
import type { AuraKind, CoatingKind, ReactionKind } from "#lib/vfx/kinds.js";

export const SHIELD_DURATION_MINUTES = 30;
export const SHIELD_DURATION_MS = SHIELD_DURATION_MINUTES * 60 * 1000;

export const OVERCHARGE_DURATION_MINUTES = 30;
export const OVERCHARGE_DURATION_MS = OVERCHARGE_DURATION_MINUTES * 60 * 1000;

export const ARMOR_COATING_DURATION_MINUTES = 30;
export const ARMOR_COATING_DURATION_MS =
	ARMOR_COATING_DURATION_MINUTES * 60 * 1000;

export type RewardVisual =
	| {
			kind: "aura";
			aura: AuraKind;
			reaction: ReactionKind;
			color: number;
	  }
	| {
			kind: "coating";
			coating: CoatingKind;
			reaction: ReactionKind;
			color: number;
	  }
	| { kind: "reaction"; reaction: ReactionKind; color: number };

export interface RewardConfig {
	key: string;
	title: string;
	description: string;
	cost: number;
	cooldown: number;
	visual: RewardVisual;
}

export const SHIELD_REWARD = {
	key: "shield",
	title: "Силовой щит",
	description: `Щит на ${SHIELD_DURATION_MINUTES} минут: 3 заряда с восстановлением каждого заряда за 20 секунд`,
	cost: 300,
	cooldown: 0,
	visual: {
		kind: "aura",
		aura: "shield",
		reaction: "reward",
		color: 0x3fa9ff,
	},
} as const satisfies RewardConfig;

export const BATTERY_REWARD = {
	key: "battery",
	title: "Энергоячейка для ремонта",
	description: `+1 Энергоячейка для ремонта (максимум 5). Потратить: !repair — +${BATTERY_HEAL_SELF} hp себе, !repair @ник — +${BATTERY_HEAL_OTHER} hp другому игроку`,
	cost: 100,
	cooldown: 0,
	visual: {
		kind: "reaction",
		reaction: "reward",
		color: 0xffd700,
	},
} as const satisfies RewardConfig;

export const REVIVE_REWARD = {
	key: "revive",
	title: "Аварийный маяк",
	description:
		"Маяк возврата в игру (максимум 1). При разрушении корабля во время раунда ты возвращаешься с полным hp",
	cost: 400,
	cooldown: 0,
	visual: {
		kind: "reaction",
		reaction: "reward",
		color: 0x4ade80,
	},
} as const satisfies RewardConfig;

export const BEACON_REWARD = {
	key: "beacon",
	title: "Циномаяк",
	description:
		"Маяк возврата другого игрока (максимум 1). Потратить: !маяк @ник — игрок возвращается с полным hp",
	cost: 400,
	cooldown: 0,
	visual: {
		kind: "reaction",
		reaction: "reward",
		color: 0x38bdf8,
	},
} as const satisfies RewardConfig;

export const DOOMSDAY_REWARD = {
	key: "doomsday",
	title: "Doomsday device",
	description: "При активации в течении 25 секунд уничтожает всех врагов",
	cost: 2000,
	cooldown: 0,
	visual: {
		kind: "reaction",
		reaction: "doomsday",
		color: 0xff3322,
	},
} as const satisfies RewardConfig;

export const TIME_STOP_REWARD = {
	key: "timestop",
	title: "Остановка времени",
	description: "Замораживает врагов на 10 секунд",
	cost: 100,
	cooldown: 0,
	visual: {
		kind: "reaction",
		reaction: "timestop",
		color: 0x66ccff,
	},
} as const satisfies RewardConfig;

export const OVERCHARGE_REWARD = {
	key: "overcharge",
	title: "Перегрузка оружия",
	description: `${OVERCHARGE_DURATION_MINUTES} минут корабль стреляет по всем словам из сообщения, а не только по первому`,
	cost: 300,
	cooldown: 0,
	visual: {
		kind: "aura",
		aura: "overcharge",
		reaction: "reward",
		color: 0xffb020,
	},
} as const satisfies RewardConfig;

export const ARMOR_COATING_REWARD = {
	key: "armorCoating",
	title: "Обмазка из рикошетиума",
	description: `${ARMOR_COATING_DURATION_MINUTES} минут вражеские снаряды вдвое реже наносят урон твоему кораблю`,
	cost: 300,
	cooldown: 0,
	visual: {
		kind: "coating",
		coating: "armorCoating",
		reaction: "reward",
		color: 0x9fd8ff,
	},
} as const satisfies RewardConfig;

export const REWARD_CONFIGS = [
	SHIELD_REWARD,
	BATTERY_REWARD,
	REVIVE_REWARD,
	BEACON_REWARD,
	DOOMSDAY_REWARD,
	TIME_STOP_REWARD,
	OVERCHARGE_REWARD,
	ARMOR_COATING_REWARD,
] as const satisfies readonly RewardConfig[];

export type REWARD_KEYS = (typeof REWARD_CONFIGS)[number]["key"];

const VISUALS = new Map<string, RewardVisual>(
	REWARD_CONFIGS.map((reward) => [reward.key, reward.visual]),
);

export function rewardVisual(key: string): RewardVisual | undefined {
	return VISUALS.get(key);
}

export interface ActiveShield {
	userId: string;
	userName: string;
	expiresAt: number;
}

export type ActiveOvercharge = ActiveShield;
export type ActiveArmorCoating = ActiveShield;
