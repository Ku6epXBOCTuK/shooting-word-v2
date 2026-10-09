export interface ChannelReward {
	id: string;
	title: string;
	cost: number;
}

export interface RewardsStatus {
	available: boolean;
	reason?: string;
}

export interface RewardsManageResult {
	ok: boolean;
	created: string[];
	updated?: string[];
	deleted: number;
	reason?: string;
}

export interface AppRewardStatus {
	key: string;
	exists: boolean;
	enabled: boolean;
}

export interface RewardsPort {
	status(uuid?: string): Promise<RewardsStatus>;
	listRewards(uuid?: string): Promise<ChannelReward[]>;
	listAppRewards(uuid?: string): Promise<AppRewardStatus[]>;
	createRewards(uuid?: string): Promise<RewardsManageResult>;
	deleteAllRewards(uuid?: string): Promise<RewardsManageResult>;
	toggleReward(
		key: string,
		enabled: boolean,
		uuid?: string,
	): Promise<RewardsManageResult>;
}
