export interface RewardIdsRepo {
	get(broadcasterId: string, key: string): string | null;
	set(broadcasterId: string, key: string, rewardId: string): void;
	list(broadcasterId: string): { key: string; rewardId: string }[];
	clear(broadcasterId: string): void;
}
