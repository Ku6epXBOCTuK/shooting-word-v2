import { features } from "../variant.js";
import type { RewardsPort } from "./port.js";
import { HttpRewardsAdapter } from "./http-adapter.js";
import { NullRewardsAdapter } from "./null-adapter.js";

export type {
	ChannelReward,
	RewardsManageResult,
	RewardsPort,
	RewardsStatus,
} from "./port.js";
export { REWARD_CONFIGS } from "./config.js";
export type { RewardConfig } from "./config.js";

export const rewards: RewardsPort = features.rewards
	? new HttpRewardsAdapter()
	: new NullRewardsAdapter();
