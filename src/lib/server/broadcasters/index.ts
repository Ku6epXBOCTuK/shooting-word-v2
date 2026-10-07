import { db } from "../db.js";
import { SqliteBroadcastersRepo } from "./sqlite-adapter.js";

export type { Broadcaster, BroadcastersRepo } from "./port.js";

export const broadcasters = new SqliteBroadcastersRepo(db);
