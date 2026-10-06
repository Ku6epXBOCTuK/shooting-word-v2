import { features } from "../variant.js";
import type { RewardsPort } from "./port.js";
import { HttpRewardsAdapter } from "./http-adapter.js";
import { NullRewardsAdapter } from "./null-adapter.js";

export type { ChannelReward, RewardsPort, RewardsStatus } from "./port.js";

export const rewards: RewardsPort = features.rewards
	? new HttpRewardsAdapter()
	: new NullRewardsAdapter();
