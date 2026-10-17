// NOTE: Plain .js on purpose - sqlite-up loads migrations via runtime
// import(), so TS here would need a loader in prod builds and vitest.
export const up = async (db) => {
	await db.exec(`
		CREATE TABLE broadcasters (
			user_id TEXT PRIMARY KEY,
			login TEXT NOT NULL,
			widget_uuid TEXT NOT NULL UNIQUE,
			token TEXT NOT NULL,
			display_name TEXT,
			widget_key TEXT
		)
	`);
	await db.exec(`
		CREATE TABLE viewers (
			broadcaster_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			data TEXT NOT NULL,
			updated_at INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY (broadcaster_id, user_id)
		)
	`);
	await db.exec(`
		CREATE TABLE settings (
			broadcaster_id TEXT PRIMARY KEY,
			data TEXT NOT NULL
		)
	`);
	await db.exec(`
		CREATE TABLE reward_settings (
			broadcaster_id TEXT PRIMARY KEY,
			data TEXT NOT NULL
		)
	`);
	await db.exec(`
		CREATE TABLE reward_ids (
			broadcaster_id TEXT NOT NULL,
			key TEXT NOT NULL,
			reward_id TEXT NOT NULL,
			PRIMARY KEY (broadcaster_id, key)
		)
	`);
	await db.exec(`
		CREATE TABLE sessions (
			token TEXT PRIMARY KEY,
			broadcaster_id TEXT NOT NULL,
			expires_at INTEGER NOT NULL
		)
	`);
	await db.exec(`
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
	await db.exec(
		"CREATE INDEX rounds_broadcaster ON rounds (broadcaster_id, id)",
	);
};

export const down = async (db) => {
	await db.exec("DROP INDEX IF EXISTS rounds_broadcaster");
	await db.exec("DROP TABLE IF EXISTS rounds");
	await db.exec("DROP TABLE IF EXISTS sessions");
	await db.exec("DROP TABLE IF EXISTS reward_ids");
	await db.exec("DROP TABLE IF EXISTS reward_settings");
	await db.exec("DROP TABLE IF EXISTS settings");
	await db.exec("DROP TABLE IF EXISTS viewers");
	await db.exec("DROP TABLE IF EXISTS broadcasters");
};
