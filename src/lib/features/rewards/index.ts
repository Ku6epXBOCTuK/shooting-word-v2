import { REWARDS_ENABLED } from "../variant.js";
import { HttpRewardsAdapter } from "./http-adapter.js";
import { NullRewardsAdapter } from "./null-adapter.js";
import type { RewardsPort } from "./port.js";

export { REWARD_CONFIGS } from "./config.js";
export type { RewardConfig } from "./config.js";
export type {
	AppRewardStatus,
	RewardValues,
	RewardsManageResult,
	RewardsPort,
	RewardsStatus,
} from "./port.js";
export {
	defaultRewardValues,
	effectiveTitle,
	normalizeValues,
	REWARDS_SCHEMA,
} from "./settings.js";

export const rewards: RewardsPort = REWARDS_ENABLED
	? new HttpRewardsAdapter()
	: new NullRewardsAdapter();
