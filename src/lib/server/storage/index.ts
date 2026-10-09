import { db } from "../db.js";
import { SqliteStorageRepo } from "./sqlite-adapter.js";

export type { StorageRepo } from "./port.js";

export const storage = new SqliteStorageRepo(db);
