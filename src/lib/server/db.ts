import { logger } from "#lib/logger.js";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";
import { Migrator } from "@ku6epxboctuk/sqlite-up";

const path = process.env.SQLITE_PATH || "data/app.db";
mkdirSync(dirname(path), { recursive: true });

export const db = new DatabaseSync(path);
logger.info(`[db] opened ${path}`);

const result = await new Migrator({
	db,
	migrationsDir: process.env.SQLITE_MIGRATIONS_DIR || "migrations",
}).apply();
if (!result.success) {
	throw result.error ?? new Error("[db] migrations failed");
}
if (result.appliedMigrations.length > 0) {
	logger.info(`[db] applied: ${result.appliedMigrations.join(", ")}`);
}
