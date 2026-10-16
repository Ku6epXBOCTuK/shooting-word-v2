import { logger } from "#lib/logger.js";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";

const path = process.env.SQLITE_PATH || "data/app.db";
mkdirSync(dirname(path), { recursive: true });

export const db = new DatabaseSync(path);
logger.info(`[db] opened ${path}`);

// NOTE: one-time split of the generic `storage` table into per-entity tables.
// Runs at open, before any repo module (which imports this one) constructs its
// own table. Idempotent: a missing `storage` table means already migrated.
function migrateStorageTables(database: DatabaseSync): void {
	const hasStorage = database
		.prepare(
			"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'storage'",
		)
		.get();
	if (!hasStorage) return;

	const keys = database.prepare("SELECT DISTINCT key FROM storage").all() as {
		key: string;
	}[];
	logger.info(
		`[db] migrating storage keys: ${keys.map((entry) => entry.key).join(", ")}`,
	);

	database.exec("BEGIN");
	try {
		database.exec(
			"CREATE TABLE IF NOT EXISTS settings (broadcaster_id TEXT PRIMARY KEY, data TEXT NOT NULL)",
		);
		database.exec(
			"CREATE TABLE IF NOT EXISTS reward_settings (broadcaster_id TEXT PRIMARY KEY, data TEXT NOT NULL)",
		);
		database.exec(
			"INSERT OR IGNORE INTO settings (broadcaster_id, data) SELECT broadcaster_id, data FROM storage WHERE key = 'settings'",
		);
		database.exec(
			"INSERT OR IGNORE INTO reward_settings (broadcaster_id, data) SELECT broadcaster_id, data FROM storage WHERE key = 'rewards'",
		);
		database.exec("DROP TABLE storage");
		database.exec("COMMIT");
		logger.info("[db] storage split into settings / reward_settings");
	} catch (error) {
		database.exec("ROLLBACK");
		throw error;
	}
}

migrateStorageTables(db);
