export interface ChannelReward {
	id: string;
	title: string;
	cost: number;
}

export interface RewardsStatus {
	available: boolean;
	reason?: string;
}

export interface RewardsPort {
	status(): Promise<RewardsStatus>;
	listRewards(): Promise<ChannelReward[]>;
}
