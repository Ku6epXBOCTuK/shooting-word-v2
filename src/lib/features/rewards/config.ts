export interface RewardConfig {
	key: string;
	title: string;
	cost: number;
	cooldown: number;
}

export const SHIELD_REWARD: RewardConfig = {
	key: "shield",
	title: "силовой щит",
	cost: 300,
	cooldown: 0,
};

export const BATTERY_REWARD: RewardConfig = {
	key: "battery",
	title: "батарея",
	cost: 200,
	cooldown: 0,
};

export const REVIVE_REWARD: RewardConfig = {
	key: "revive",
	title: "аварийный маяк",
	cost: 400,
	cooldown: 0,
};

export const DOOMSDAY_REWARD: RewardConfig = {
	key: "doomsday",
	title: "doomsday device",
	cost: 2000,
	cooldown: 0,
};

export const REWARD_CONFIGS: RewardConfig[] = [
	SHIELD_REWARD,
	BATTERY_REWARD,
	REVIVE_REWARD,
	DOOMSDAY_REWARD,
];

export const SHIELD_DURATION_MS = 10 * 60 * 1000;

export interface ActiveShield {
	userId: string;
	userName: string;
	expiresAt: number;
}
