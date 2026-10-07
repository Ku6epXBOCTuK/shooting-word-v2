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
	private url(uuid?: string): string {
		const base = resolve("/api/rewards");
		return uuid ? `${base}?uuid=${encodeURIComponent(uuid)}` : base;
	}

	private async request(uuid?: string): Promise<RewardsResponse> {
		const response = await fetch(this.url(uuid));
		const body = (await response.json()) as RewardsResponse;
		return body;
	}

	private async manage(
		action: "create" | "delete",
		uuid?: string,
	): Promise<RewardsManageResult> {
		const response = await fetch(this.url(uuid), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ action }),
		});
		return (await response.json()) as RewardsManageResult;
	}

	async status(uuid?: string): Promise<RewardsStatus> {
		const { available, reason } = await this.request(uuid);
		return { available, reason };
	}

	async listRewards(uuid?: string): Promise<ChannelReward[]> {
		const { rewards } = await this.request(uuid);
		return rewards;
	}

	async createRewards(uuid?: string): Promise<RewardsManageResult> {
		return this.manage("create", uuid);
	}

	async deleteAllRewards(uuid?: string): Promise<RewardsManageResult> {
		return this.manage("delete", uuid);
	}
}
