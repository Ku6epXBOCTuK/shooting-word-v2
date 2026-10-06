import type {
	ChannelReward,
	RewardsManageResult,
	RewardsPort,
	RewardsStatus,
} from "./port.js";

const NOT_SUPPORTED: RewardsManageResult = {
	ok: false,
	created: [],
	deleted: 0,
	reason: "rewards are not supported in this build",
};

export class NullRewardsAdapter implements RewardsPort {
	async status(): Promise<RewardsStatus> {
		return {
			available: false,
			reason: "rewards are not supported in this build",
		};
	}

	async listRewards(): Promise<ChannelReward[]> {
		return [];
	}

	async createRewards(): Promise<RewardsManageResult> {
		return NOT_SUPPORTED;
	}

	async deleteAllRewards(): Promise<RewardsManageResult> {
		return NOT_SUPPORTED;
	}
}
