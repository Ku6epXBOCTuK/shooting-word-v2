export interface RewardConfig {
	key: string;
	title: string;
	cost: number;
}

export const SHIELD_REWARD: RewardConfig = {
	key: "shield",
	title: "силовой щит",
	cost: 300,
};

export const BATTERY_REWARD: RewardConfig = {
	key: "battery",
	title: "батарея",
	cost: 200,
};

export const REWARD_CONFIGS: RewardConfig[] = [SHIELD_REWARD, BATTERY_REWARD];

export const SHIELD_DURATION_MS = 10 * 60 * 1000;

export interface ActiveShield {
	userId: string;
	userName: string;
	expiresAt: number;
}
