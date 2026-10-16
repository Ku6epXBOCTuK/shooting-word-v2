import { db } from "../db.js";
import { SqliteRewardSettingsRepo } from "./sqlite-adapter.js";

export type { RewardSettingsRepo } from "./port.js";

export const rewardSettings = new SqliteRewardSettingsRepo(db);
