export interface RewardsStatus {
	available: boolean;
	reason?: string;
}

export interface RewardValues {
	title: string;
	description: string;
	cost: number;
	cooldown: number;
}

export interface RewardsManageResult {
	ok: boolean;
	created: string[];
	updated?: string[];
	deleted: number;
	refunded?: number;
	reason?: string;
}

export interface AppRewardStatus {
	key: string;
	exists: boolean;
	enabled: boolean;
	live?: RewardValues;
}

export interface RewardsPort {
	status(uuid?: string): Promise<RewardsStatus>;
	listAppRewards(uuid?: string): Promise<AppRewardStatus[]>;
	updateAll(uuid?: string): Promise<RewardsManageResult>;
	update(
		key: string,
		values: RewardValues,
		uuid?: string,
	): Promise<RewardsManageResult>;
	deleteReward(
		key: string,
		refund: boolean,
		uuid?: string,
	): Promise<RewardsManageResult>;
	deleteAllRewards(
		refund: boolean,
		uuid?: string,
	): Promise<RewardsManageResult>;
	toggleReward(
		key: string,
		enabled: boolean,
		uuid?: string,
	): Promise<RewardsManageResult>;
}
