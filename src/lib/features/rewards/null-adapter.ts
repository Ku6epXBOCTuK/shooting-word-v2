import type { ChannelReward, RewardsPort, RewardsStatus } from "./port.js";

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
}
