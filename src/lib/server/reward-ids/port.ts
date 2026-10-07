export interface RewardIdsRepo {
	get(broadcasterId: string, key: string): string | null;
	set(broadcasterId: string, key: string, rewardId: string): void;
	clear(broadcasterId: string): void;
}
