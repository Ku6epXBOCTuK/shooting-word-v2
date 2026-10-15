import { resolve } from "$app/paths";
import type {
	AppRewardStatus,
	RewardsImportResult,
	RewardsManageResult,
	RewardsPort,
	RewardsStatus,
} from "./port.js";

interface RewardsResponse {
	available: boolean;
	reason?: string;
	appRewards?: AppRewardStatus[];
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
		body: Record<string, unknown>,
		uuid?: string,
	): Promise<RewardsManageResult> {
		const response = await fetch(this.url(uuid), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});
		return (await response.json()) as RewardsManageResult;
	}

	async status(uuid?: string): Promise<RewardsStatus> {
		const { available, reason } = await this.request(uuid);
		return { available, reason };
	}

	async listAppRewards(uuid?: string): Promise<AppRewardStatus[]> {
		const { appRewards } = await this.request(uuid);
		return appRewards ?? [];
	}

	async updateAll(uuid?: string): Promise<RewardsManageResult> {
		return this.manage({ action: "update-all" }, uuid);
	}

	async update(key: string, uuid?: string): Promise<RewardsManageResult> {
		return this.manage({ action: "update", key }, uuid);
	}

	async deleteAllRewards(uuid?: string): Promise<RewardsManageResult> {
		return this.manage({ action: "delete" }, uuid);
	}

	async toggleReward(
		key: string,
		enabled: boolean,
		uuid?: string,
	): Promise<RewardsManageResult> {
		return this.manage({ action: "toggle", key, enabled }, uuid);
	}

	async importReward(key: string, uuid?: string): Promise<RewardsImportResult> {
		const response = await fetch(this.url(uuid), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ action: "import", key }),
		});
		return (await response.json()) as RewardsImportResult;
	}
}
