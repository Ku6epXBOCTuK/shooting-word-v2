import { ApiClient } from "@twurple/api";
import { EventSubWsListener } from "@twurple/eventsub-ws";
import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
import { logger } from "#lib/logger.js";
import type { Broadcaster } from "./broadcasters/index.js";
import { rewardIds } from "./reward-ids/index.js";
import { getApiClient } from "./twitch-auth.js";

export interface RedemptionEvent {
	id: string;
	userId: string;
	userName: string;
	rewardTitle: string;
}

interface BroadcasterState {
	listener: EventSubWsListener | null;
	subscribed: Set<string>;
}

const globalScope = globalThis as typeof globalThis & {
	__redemptionsStates?: Map<string, BroadcasterState>;
};

const states = (globalScope.__redemptionsStates ??= new Map());

function stateFor(userId: string): BroadcasterState {
	let state = states.get(userId);
	if (!state) {
		state = { listener: null, subscribed: new Set() };
		states.set(userId, state);
	}
	return state;
}

async function resolveRewardId(
	apiClient: ApiClient,
	broadcaster: Broadcaster,
	key: string,
): Promise<string | null> {
	const stored = rewardIds.get(broadcaster.userId, key);
	if (stored) return stored;

	const config = REWARD_CONFIGS.find((reward) => reward.key === key);
	if (!config) return null;

	const rewards = await apiClient.channelPoints.getCustomRewards(
		broadcaster.userId,
		true,
	);
	const reward = rewards.find(({ title }) => title === config.title);
	if (!reward) return null;

	rewardIds.set(broadcaster.userId, key, reward.id);
	logger.info(`[redemptions] reward id for "${key}" stored: ${reward.id}`);
	return reward.id;
}

function ensureListener(
	state: BroadcasterState,
	apiClient: ApiClient,
): EventSubWsListener {
	if (state.listener) return state.listener;

	const listener = new EventSubWsListener({ apiClient });
	state.listener = listener;
	listener.start();

	listener.onSubscriptionCreateFailure((_subscription, error) => {
		logger.error(`[redemptions] subscription failed: ${error.message}`);
	});

	logger.info("[redemptions] eventsub listener started");
	return listener;
}

export async function subscribeRedemptions(
	broadcaster: Broadcaster,
	key: string,
	handler: (event: RedemptionEvent) => void,
): Promise<boolean> {
	const apiClient = await getApiClient(broadcaster);

	if (!apiClient) {
		logger.info(
			`[redemptions] ${broadcaster.login} not authorized yet, will retry later`,
		);
		return false;
	}

	const state = stateFor(broadcaster.userId);
	const rewardId = await resolveRewardId(apiClient, broadcaster, key);

	if (!rewardId) {
		logger.warn(`[redemptions] reward "${key}" not found`);
		return false;
	}

	if (state.subscribed.has(rewardId)) return true;

	const listener = ensureListener(state, apiClient);

	listener.onChannelRedemptionAddForReward(
		broadcaster.userId,
		rewardId,
		(event) => {
			logger.info(
				`[redemptions] ${event.userName} redeemed "${event.rewardTitle}"`,
			);

			handler({
				id: event.id,
				userId: event.userId,
				userName: event.userName,
				rewardTitle: event.rewardTitle,
			});
		},
	);

	state.subscribed.add(rewardId);
	logger.info(`[redemptions] subscribed to reward ${rewardId}`);
	return true;
}
