import { logger } from "#lib/logger.js";
import type { DatabaseSync } from "node:sqlite";

export interface Migration {
	version: number;
	name: string;
	up(db: DatabaseSync): void;
}

// NOTE: The single owner of the sqlite schema. Repo constructors never create
// tables or indexes - using a repo against a database that has not been
// migrated is a bug, not a self-healing case.
const initialSchema: Migration = {
	version: 1,
	name: "initial-schema",
	up(db) {
		db.exec(`
			CREATE TABLE broadcasters (
				user_id TEXT PRIMARY KEY,
				login TEXT NOT NULL,
				widget_uuid TEXT NOT NULL UNIQUE,
				token TEXT NOT NULL,
				display_name TEXT,
				widget_key TEXT
			)
		`);
		db.exec(`
			CREATE TABLE viewers (
				broadcaster_id TEXT NOT NULL,
				user_id TEXT NOT NULL,
				data TEXT NOT NULL,
				updated_at INTEGER NOT NULL DEFAULT 0,
				PRIMARY KEY (broadcaster_id, user_id)
			)
		`);
		db.exec(`
			CREATE TABLE settings (
				broadcaster_id TEXT PRIMARY KEY,
				data TEXT NOT NULL
			)
		`);
		db.exec(`
			CREATE TABLE reward_settings (
				broadcaster_id TEXT PRIMARY KEY,
				data TEXT NOT NULL
			)
		`);
		db.exec(`
			CREATE TABLE reward_ids (
				broadcaster_id TEXT NOT NULL,
				key TEXT NOT NULL,
				reward_id TEXT NOT NULL,
				PRIMARY KEY (broadcaster_id, key)
			)
		`);
		db.exec(`
			CREATE TABLE sessions (
				token TEXT PRIMARY KEY,
				broadcaster_id TEXT NOT NULL,
				expires_at INTEGER NOT NULL
			)
		`);
		db.exec(`
			CREATE TABLE rounds (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				broadcaster_id TEXT NOT NULL,
				started_at INTEGER NOT NULL,
				duration_sec REAL NOT NULL,
				outcome TEXT NOT NULL,
				afk INTEGER NOT NULL,
				viewers INTEGER NOT NULL,
				deaths INTEGER NOT NULL,
				revives INTEGER NOT NULL,
				words_spawned INTEGER NOT NULL,
				words_expired INTEGER NOT NULL,
				max_enemies INTEGER NOT NULL,
				kills INTEGER NOT NULL,
				misses INTEGER NOT NULL,
				heals INTEGER NOT NULL,
				doomsday INTEGER NOT NULL,
				avg_enemies REAL NOT NULL,
				avg_hp_fraction REAL NOT NULL
			)
		`);
		db.exec("CREATE INDEX rounds_broadcaster ON rounds (broadcaster_id, id)");
	},
};

export const migrations: Migration[] = [initialSchema];

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
