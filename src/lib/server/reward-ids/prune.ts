export interface RewardIdEntry {
	key: string;
	rewardId: string;
}

export interface RewardPrunePlan {
	deleteIds: string[];
	staleKeys: string[];
}

export function planRewardPrune(
	entries: RewardIdEntry[],
	validKeys: ReadonlySet<string>,
	manageableIds: readonly string[],
): RewardPrunePlan {
	const validIds = new Set(
		entries
			.filter((entry) => validKeys.has(entry.key))
			.map((entry) => entry.rewardId),
	);

	return {
		deleteIds: manageableIds.filter((id) => !validIds.has(id)),
		staleKeys: entries
			.filter((entry) => !validKeys.has(entry.key))
			.map((entry) => entry.key),
	};
}
