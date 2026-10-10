export interface RewardConfig {
	key: string;
	title: string;
	cost: number;
	cooldown: number;
}

export const SHIELD_REWARD: RewardConfig = {
	key: "shield",
	title: "Силовой щит",
	cost: 300,
	cooldown: 0,
};

export const BATTERY_REWARD: RewardConfig = {
	key: "battery",
	title: "Батарея",
	cost: 200,
	cooldown: 0,
};

export const REVIVE_REWARD: RewardConfig = {
	key: "revive",
	title: "Аварийный маяк",
	cost: 400,
	cooldown: 0,
};

export const DOOMSDAY_REWARD: RewardConfig = {
	key: "doomsday",
	title: "Doomsday device",
	cost: 2000,
	cooldown: 0,
};

export const TIME_STOP_REWARD: RewardConfig = {
	key: "timestop",
	title: "Остановка времени",
	cost: 500,
	cooldown: 0,
};

export const OVERCHARGE_REWARD: RewardConfig = {
	key: "overcharge",
	title: "Перегрузка оружия",
	cost: 600,
	cooldown: 0,
};

export const REWARD_CONFIGS: RewardConfig[] = [
	SHIELD_REWARD,
	BATTERY_REWARD,
	REVIVE_REWARD,
	DOOMSDAY_REWARD,
	TIME_STOP_REWARD,
	OVERCHARGE_REWARD,
];

export const SHIELD_DURATION_MS = 10 * 60 * 1000;
export const OVERCHARGE_DURATION_MS = 2 * 60 * 1000;

export interface ActiveShield {
	userId: string;
	userName: string;
	expiresAt: number;
}

export type ActiveOvercharge = ActiveShield;
