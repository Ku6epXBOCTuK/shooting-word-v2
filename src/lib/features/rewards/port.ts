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
	status(): Promise<RewardsStatus>;
	listRewards(): Promise<ChannelReward[]>;
	createRewards(): Promise<RewardsManageResult>;
	deleteAllRewards(): Promise<RewardsManageResult>;
}
