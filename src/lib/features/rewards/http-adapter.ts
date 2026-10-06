import { resolve } from "$app/paths";
import type {
	ChannelReward,
	RewardsManageResult,
	RewardsPort,
	RewardsStatus,
} from "./port.js";

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

	private async manage(
		action: "create" | "delete",
	): Promise<RewardsManageResult> {
		const response = await fetch(resolve("/api/rewards"), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ action }),
		});
		return (await response.json()) as RewardsManageResult;
	}

	async status(): Promise<RewardsStatus> {
		const { available, reason } = await this.request();
		return { available, reason };
	}

	async listRewards(): Promise<ChannelReward[]> {
		const { rewards } = await this.request();
		return rewards;
	}

	async createRewards(): Promise<RewardsManageResult> {
		return this.manage("create");
	}

	async deleteAllRewards(): Promise<RewardsManageResult> {
		return this.manage("delete");
	}
}
