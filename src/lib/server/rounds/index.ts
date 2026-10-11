import { db } from "../db.js";
import { SqliteRoundsRepo } from "./sqlite-adapter.js";

export type { RoundsRepo } from "./port.js";

export const rounds = new SqliteRoundsRepo(db);
