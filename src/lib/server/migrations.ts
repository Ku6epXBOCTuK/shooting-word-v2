import { logger } from "#lib/logger.js";
import type { DatabaseSync } from "node:sqlite";

export interface Migration {
	version: number;
	name: string;
	up(db: DatabaseSync): void;
}

// NOTE: Guards on table/column existence keep every step safe on databases
// where the change already ran before versioning existed, and on fresh ones -
// repo constructors create it with the full column set.
const addColumn = (
	version: number,
	name: string,
	table: string,
	column: string,
	type: string,
): Migration => ({
	version,
	name,
	up(db) {
		const exists = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
			)
			.get(table);
		if (!exists) return;
		const columns = db.prepare(`PRAGMA table_info(${table})`).all() as {
			name: string;
		}[];
		if (columns.some((entry) => entry.name === column)) return;
		db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
	},
});

// NOTE: One-time split of the generic `storage` table into per-entity tables;
// a missing `storage` table means already migrated.
const storageSplit: Migration = {
	version: 1,
	name: "storage-split",
	up(db) {
		const hasStorage = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'storage'",
			)
			.get();
		if (!hasStorage) return;

		const keys = db.prepare("SELECT DISTINCT key FROM storage").all() as {
			key: string;
		}[];
		logger.info(
			`[db] migrating storage keys: ${keys.map((entry) => entry.key).join(", ")}`,
		);

		db.exec(
			"CREATE TABLE IF NOT EXISTS settings (broadcaster_id TEXT PRIMARY KEY, data TEXT NOT NULL)",
		);
		db.exec(
			"CREATE TABLE IF NOT EXISTS reward_settings (broadcaster_id TEXT PRIMARY KEY, data TEXT NOT NULL)",
		);
		db.exec(
			"INSERT OR IGNORE INTO settings (broadcaster_id, data) SELECT broadcaster_id, data FROM storage WHERE key = 'settings'",
		);
		db.exec(
			"INSERT OR IGNORE INTO reward_settings (broadcaster_id, data) SELECT broadcaster_id, data FROM storage WHERE key = 'rewards'",
		);
		db.exec("DROP TABLE storage");
		logger.info("[db] storage split into settings / reward_settings");
	},
};

export const migrations: Migration[] = [
	storageSplit,
	addColumn(
		2,
		"broadcasters-display-name",
		"broadcasters",
		"display_name",
		"TEXT",
	),
	addColumn(3, "broadcasters-widget-key", "broadcasters", "widget_key", "TEXT"),
	addColumn(
		4,
		"viewers-updated-at",
		"viewers",
		"updated_at",
		"INTEGER NOT NULL DEFAULT 0",
	),
];

export function runMigrations(
	db: DatabaseSync,
	steps: Migration[] = migrations,
): void {
	for (let index = 1; index < steps.length; index += 1) {
		if (steps[index].version <= steps[index - 1].version) {
			throw new Error("migrations must be ordered by version");
		}
	}
	const current = (
		db.prepare("PRAGMA user_version").get() as { user_version: number }
	).user_version;
	for (const step of steps) {
		if (step.version <= current) continue;
		db.exec("BEGIN");
		try {
			step.up(db);
			db.exec(`PRAGMA user_version = ${step.version}`);
			db.exec("COMMIT");
		} catch (error) {
			db.exec("ROLLBACK");
			throw error;
		}
		logger.info(`[db] migration ${step.version} ${step.name}`);
	}
}
