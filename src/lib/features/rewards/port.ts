export interface RewardsStatus {
	available: boolean;
	reason?: string;
}

export interface RewardsManageResult {
	ok: boolean;
	created: string[];
	updated?: string[];
	deleted: number;
	reason?: string;
}

export interface AppRewardStatus {
	key: string;
	exists: boolean;
	enabled: boolean;
	diverged?: boolean;
}

export interface RewardsImportResult {
	ok: boolean;
	overrides?: {
		title?: string;
		description?: string;
		cost?: number;
		cooldown?: number;
	};
	reason?: string;
}

export interface RewardsPort {
	status(uuid?: string): Promise<RewardsStatus>;
	listAppRewards(uuid?: string): Promise<AppRewardStatus[]>;
	updateAll(uuid?: string): Promise<RewardsManageResult>;
	update(key: string, uuid?: string): Promise<RewardsManageResult>;
	deleteAllRewards(uuid?: string): Promise<RewardsManageResult>;
	toggleReward(
		key: string,
		enabled: boolean,
		uuid?: string,
	): Promise<RewardsManageResult>;
	importReward(key: string, uuid?: string): Promise<RewardsImportResult>;
}
