import { ApiClient } from "@twurple/api";
import { EventSubWsListener } from "@twurple/eventsub-ws";
import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
import { getRewardId, setRewardId } from "./reward-store.js";
import {
	getAuthProvider,
	getStoredUserId,
	isConfigured,
} from "./twitch-auth.js";

export interface RedemptionEvent {
	id: string;
	userId: string;
	userName: string;
	rewardTitle: string;
}

interface RedemptionsState {
	listener: EventSubWsListener | null;
	subscribed: Set<string>;
}

const globalScope = globalThis as typeof globalThis & {
	__redemptionsState?: RedemptionsState;
};

const state = (globalScope.__redemptionsState ??= {
	listener: null,
	subscribed: new Set(),
});

async function resolveContext() {
	if (!isConfigured()) return null;

	const authProvider = await getAuthProvider();
	const userId = getStoredUserId();
	if (!authProvider || !userId) return null;

	return { apiClient: new ApiClient({ authProvider }), userId };
}

async function resolveRewardId(
	apiClient: ApiClient,
	userId: string,
	key: string,
): Promise<string | null> {
	const stored = await getRewardId(key);
	if (stored) return stored;

	const config = REWARD_CONFIGS.find((reward) => reward.key === key);
	if (!config) return null;

	const rewards = await apiClient.channelPoints.getCustomRewards(userId, true);
	const reward = rewards.find(({ title }) => title === config.title);
	if (!reward) return null;

	await setRewardId(key, reward.id);
	console.log(`[redemptions] reward id for "${key}" stored: ${reward.id}`);
	return reward.id;
}

function ensureListener(apiClient: ApiClient): EventSubWsListener {
	if (state.listener) return state.listener;

	const listener = new EventSubWsListener({ apiClient });
	state.listener = listener;
	listener.start();

	listener.onSubscriptionCreateFailure((_subscription, error) => {
		console.error(`[redemptions] subscription failed: ${error.message}`);
	});

	console.log("[redemptions] eventsub listener started");
	return listener;
}

export async function subscribeRedemptions(
	key: string,
	handler: (event: RedemptionEvent) => void,
): Promise<boolean> {
	const context = await resolveContext();

	if (!context) {
		console.log("[redemptions] not authorized yet, will retry later");
		return false;
	}

	const rewardId = await resolveRewardId(
		context.apiClient,
		context.userId,
		key,
	);

	if (!rewardId) {
		console.warn(`[redemptions] reward "${key}" not found`);
		return false;
	}

	if (state.subscribed.has(rewardId)) return true;

	const listener = ensureListener(context.apiClient);

	listener.onChannelRedemptionAddForReward(
		context.userId,
		rewardId,
		(event) => {
			console.log(
				`[redemptions] ${event.userName} redeemed "${event.rewardTitle}"`,
			);

			context.apiClient.channelPoints
				.updateRedemptionStatusByIds(
					context.userId,
					rewardId,
					[event.id],
					"FULFILLED",
				)
				.catch((error: unknown) => {
					console.error(
						`[redemptions] failed to fulfill ${event.id}: ${error instanceof Error ? error.message : String(error)}`,
					);
				});

			handler({
				id: event.id,
				userId: event.userId,
				userName: event.userName,
				rewardTitle: event.rewardTitle,
			});
		},
	);

	state.subscribed.add(rewardId);
	console.log(`[redemptions] subscribed to reward ${rewardId}`);
	return true;
}
