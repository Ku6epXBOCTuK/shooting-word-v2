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
	deleted: number;
	reason?: string;
}

export interface RewardsPort {
	status(uuid?: string): Promise<RewardsStatus>;
	listRewards(uuid?: string): Promise<ChannelReward[]>;
	createRewards(uuid?: string): Promise<RewardsManageResult>;
	deleteAllRewards(uuid?: string): Promise<RewardsManageResult>;
}
