import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";
import { logger } from "#lib/logger.js";

const path = process.env.SQLITE_PATH || "data/app.db";
mkdirSync(dirname(path), { recursive: true });

export const db = new DatabaseSync(path);
logger.info(`[db] opened ${path}`);
