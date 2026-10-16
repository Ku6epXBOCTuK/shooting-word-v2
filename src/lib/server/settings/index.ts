import { db } from "../db.js";
import { SqliteSettingsRepo } from "./sqlite-adapter.js";

export type { SettingsRepo } from "./port.js";

export const settings = new SqliteSettingsRepo(db);
