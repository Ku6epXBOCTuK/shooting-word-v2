export interface RewardIdsRepo {
	get(broadcasterId: string, key: string): string | null;
	set(broadcasterId: string, key: string, rewardId: string): void;
	list(broadcasterId: string): { key: string; rewardId: string }[];
	remove(broadcasterId: string, key: string): void;
	clear(broadcasterId: string): void;
}
