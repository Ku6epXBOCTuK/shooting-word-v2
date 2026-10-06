import { resolve } from "$app/paths";
import type { ChannelReward, RewardsPort, RewardsStatus } from "./port.js";

interface RewardsResponse {
	available: boolean;
	reason?: string;
	rewards: ChannelReward[];
}

export class HttpRewardsAdapter implements RewardsPort {
	private async request(): Promise<RewardsResponse> {
		const response = await fetch(resolve("/api/rewards"));
		const body = (await response.json()) as RewardsResponse;
		return body;
	}

	async status(): Promise<RewardsStatus> {
		const { available, reason } = await this.request();
		return { available, reason };
	}

	async listRewards(): Promise<ChannelReward[]> {
		const { rewards } = await this.request();
		return rewards;
	}
}
