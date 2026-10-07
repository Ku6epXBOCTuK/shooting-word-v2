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

export const REWARD_CONFIGS: RewardConfig[] = [SHIELD_REWARD];

export const SHIELD_DURATION_MS = 10 * 60 * 1000;

export interface ActiveShield {
	userId: string;
	expiresAt: number;
}
