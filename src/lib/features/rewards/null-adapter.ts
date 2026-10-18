import type {
	AppRewardStatus,
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

	async listAppRewards(): Promise<AppRewardStatus[]> {
		return [];
	}

	async updateAll(): Promise<RewardsManageResult> {
		return NOT_SUPPORTED;
	}

	async update(): Promise<RewardsManageResult> {
		return NOT_SUPPORTED;
	}

	async deleteReward(): Promise<RewardsManageResult> {
		return NOT_SUPPORTED;
	}

	async deleteAllRewards(): Promise<RewardsManageResult> {
		return NOT_SUPPORTED;
	}

	async toggleReward(): Promise<RewardsManageResult> {
		return NOT_SUPPORTED;
	}
}
