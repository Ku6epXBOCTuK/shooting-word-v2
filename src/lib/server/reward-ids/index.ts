import { db } from "../db.js";
import { SqliteRewardIdsRepo } from "./sqlite-adapter.js";

export type { RewardIdsRepo } from "./port.js";

export const rewardIds = new SqliteRewardIdsRepo(db);
