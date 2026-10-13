import { BATTERY_HEAL_OTHER, BATTERY_HEAL_SELF } from "#lib/game/config.js";

export interface RewardConfig {
	key: string;
	title: string;
	description: string;
	cost: number;
	cooldown: number;
}

export const SHIELD_REWARD = {
	key: "shield",
	title: "Силовой щит",
	description:
		"Щит на 10 минут: 3 заряда с восстановлением каждого заряда за 20 секунд",
	cost: 300,
	cooldown: 0,
} as const satisfies RewardConfig;

export const BATTERY_REWARD = {
	key: "battery",
	title: "Энергоячейка для ремонта",
	description: `+1 Энергоячейка для ремонта (максимум 5). Потратить: !repair — +${BATTERY_HEAL_SELF} hp себе, !repair @ник — +${BATTERY_HEAL_OTHER} hp другому игроку`,
	cost: 200,
	cooldown: 0,
} as const satisfies RewardConfig;

export const REVIVE_REWARD = {
	key: "revive",
	title: "Аварийный маяк",
	description:
		"Маяк возврата в игру (максимум 1). При разрушении корабля во время раунда ты возвращаешься с полным hp",
	cost: 400,
	cooldown: 0,
} as const satisfies RewardConfig;

export const BEACON_REWARD = {
	key: "beacon",
	title: "Циномаяк",
	description:
		"Маяк возврата другого игрока (максимум 1). Потратить: !маяк @ник — игрок возвращается с полным hp",
	cost: 400,
	cooldown: 0,
} as const satisfies RewardConfig;

export const DOOMSDAY_REWARD = {
	key: "doomsday",
	title: "Doomsday device",
	description: "При активации в течении 25 секунд уничтожает всех врагов",
	cost: 2000,
	cooldown: 0,
} as const satisfies RewardConfig;

export const TIME_STOP_REWARD = {
	key: "timestop",
	title: "Остановка времени",
	description: "Замораживает врагов на 10 секунд",
	cost: 500,
	cooldown: 0,
} as const satisfies RewardConfig;

export const OVERCHARGE_REWARD = {
	key: "overcharge",
	title: "Перегрузка оружия",
	description:
		"10 минут корабль стреляет по всем словам из сообщения, а не только по первому",
	cost: 200,
	cooldown: 0,
} as const satisfies RewardConfig;

export const RICOCHETIUM_REWARD = {
	key: "ricochetium",
	title: "Обмазка из рикошетиума",
	description:
		"10 минут вражеские снаряды вдвое реже наносят урон твоему кораблю",
	cost: 300,
	cooldown: 0,
} as const satisfies RewardConfig;

export const REWARD_CONFIGS = [
	SHIELD_REWARD,
	BATTERY_REWARD,
	REVIVE_REWARD,
	BEACON_REWARD,
	DOOMSDAY_REWARD,
	TIME_STOP_REWARD,
	OVERCHARGE_REWARD,
	RICOCHETIUM_REWARD,
] as const satisfies readonly RewardConfig[];

export type REWARD_KEYS = (typeof REWARD_CONFIGS)[number]["key"];

export const SHIELD_DURATION_MS = 10 * 60 * 1000;
export const OVERCHARGE_DURATION_MS = 10 * 60 * 1000;
export const RICOCHETIUM_DURATION_MS = 10 * 60 * 1000;

export interface ActiveShield {
	userId: string;
	userName: string;
	expiresAt: number;
}

export type ActiveOvercharge = ActiveShield;
export type ActiveRicochetium = ActiveShield;
