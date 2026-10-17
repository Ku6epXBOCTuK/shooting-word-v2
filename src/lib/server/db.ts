import { logger } from "#lib/logger.js";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";
import { migrateStorageTables } from "./storage-migration.js";

const path = process.env.SQLITE_PATH || "data/app.db";
mkdirSync(dirname(path), { recursive: true });

export const db = new DatabaseSync(path);
logger.info(`[db] opened ${path}`);

migrateStorageTables(db);
