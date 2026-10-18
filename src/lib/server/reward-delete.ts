import type { ApiClient } from "@twurple/api";

const REFUND_BATCH = 50;

export async function refundUnfulfilled(
	api: ApiClient,
	userId: string,
	rewardId: string,
): Promise<number> {
	const redemptionIds: string[] = [];
	let cursor: string | undefined;

	do {
		const page = await api.channelPoints.getRedemptionsForBroadcaster(
			userId,
			rewardId,
			"UNFULFILLED",
			cursor ? { after: cursor } : {},
		);
		redemptionIds.push(...page.data.map((item) => item.id));
		cursor = page.cursor;
	} while (cursor);

	for (let index = 0; index < redemptionIds.length; index += REFUND_BATCH) {
		await api.channelPoints.updateRedemptionStatusByIds(
			userId,
			rewardId,
			redemptionIds.slice(index, index + REFUND_BATCH),
			"CANCELED",
		);
	}

	return redemptionIds.length;
}

export async function deleteRewardWithRefund(
	api: ApiClient,
	userId: string,
	rewardId: string,
	refund: boolean,
): Promise<number> {
	const refunded = refund ? await refundUnfulfilled(api, userId, rewardId) : 0;
	await api.channelPoints.deleteCustomReward(userId, rewardId);
	return refunded;
}
