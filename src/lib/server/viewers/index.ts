import { db } from "../db.js";
import { SqliteViewersRepo } from "./sqlite-adapter.js";

export type { ViewerProfile, ViewersRepo } from "./port.js";

export const viewers = new SqliteViewersRepo(db);
