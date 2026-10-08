import { db } from "../db.js";
import { SqliteSessionsRepo } from "./sqlite-adapter.js";

export type { SessionsRepo } from "./port.js";

export const SESSION_COOKIE = "sw_session";

export const sessions = new SqliteSessionsRepo(db);
