import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import type { Migration } from "./migrations.js";
import { migrations, runMigrations } from "./migrations.js";

const latestVersion = (): number =>
	migrations[migrations.length - 1]?.version ?? 0;

const userVersion = (db: DatabaseSync): number =>
	(db.prepare("PRAGMA user_version").get() as { user_version: number })
		.user_version;

const tableExists = (db: DatabaseSync, name: string): boolean =>
	(db
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
		.get(name) as { name: string } | undefined) !== undefined;

const columns = (db: DatabaseSync, table: string): string[] =>
	(db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
		(entry) => entry.name,
	);

function createLegacyStorage(db: DatabaseSync): void {
	db.exec(`CREATE TABLE storage (
		broadcaster_id TEXT NOT NULL,
		key TEXT NOT NULL,
		data TEXT NOT NULL,
		PRIMARY KEY (broadcaster_id, key)
	)`);
}

describe("storage-split step", () => {
	it("copies settings and rewards rows into per-entity tables and drops storage", () => {
		const db = new DatabaseSync(":memory:");
		createLegacyStorage(db);
		const insert = db.prepare(
			"INSERT INTO storage (broadcaster_id, key, data) VALUES (?, ?, ?)",
		);
		insert.run("b1", "settings", JSON.stringify({ batteryMax: 5 }));
		insert.run("b1", "rewards", JSON.stringify({ battery: { cost: 10 } }));
		insert.run("b2", "settings", JSON.stringify({ batteryMax: 9 }));

		runMigrations(db);

		expect(
			db
				.prepare("SELECT data FROM settings WHERE broadcaster_id = ?")
				.get("b1"),
		).toEqual({ data: JSON.stringify({ batteryMax: 5 }) });
		expect(
			db
				.prepare("SELECT data FROM settings WHERE broadcaster_id = ?")
				.get("b2"),
		).toEqual({ data: JSON.stringify({ batteryMax: 9 }) });
		expect(
			db
				.prepare("SELECT data FROM reward_settings WHERE broadcaster_id = ?")
				.get("b1"),
		).toEqual({ data: JSON.stringify({ battery: { cost: 10 } }) });
		expect(tableExists(db, "storage")).toBe(false);
	});

	it("is idempotent when storage is already gone", () => {
		const db = new DatabaseSync(":memory:");
		db.exec(
			"CREATE TABLE settings (broadcaster_id TEXT PRIMARY KEY, data TEXT NOT NULL)",
		);
		db.prepare("INSERT INTO settings VALUES (?, ?)").run(
			"b1",
			JSON.stringify({ batteryMax: 3 }),
		);

		runMigrations(db);
		runMigrations(db);

		expect(
			db
				.prepare("SELECT data FROM settings WHERE broadcaster_id = ?")
				.get("b1"),
		).toEqual({ data: JSON.stringify({ batteryMax: 3 }) });
	});

	it("does not overwrite rows already present in the target tables", () => {
		const db = new DatabaseSync(":memory:");
		db.exec(
			"CREATE TABLE settings (broadcaster_id TEXT PRIMARY KEY, data TEXT NOT NULL)",
		);
		db.prepare("INSERT INTO settings VALUES (?, ?)").run(
			"b1",
			JSON.stringify({ batteryMax: 7 }),
		);
		createLegacyStorage(db);
		db.prepare("INSERT INTO storage VALUES (?, ?, ?)").run(
			"b1",
			"settings",
			JSON.stringify({ batteryMax: 1 }),
		);

		runMigrations(db);

		expect(
			db
				.prepare("SELECT data FROM settings WHERE broadcaster_id = ?")
				.get("b1"),
		).toEqual({ data: JSON.stringify({ batteryMax: 7 }) });
	});

	it("ignores unknown legacy keys and still drops storage", () => {
		const db = new DatabaseSync(":memory:");
		createLegacyStorage(db);
		db.prepare("INSERT INTO storage VALUES (?, ?, ?)").run(
			"b1",
			"legacy",
			"{}",
		);

		runMigrations(db);

		expect(db.prepare("SELECT * FROM settings").all()).toEqual([]);
		expect(db.prepare("SELECT * FROM reward_settings").all()).toEqual([]);
		expect(tableExists(db, "storage")).toBe(false);
	});
});

describe("runMigrations", () => {
	it("advances user_version to the latest step on a fresh database without creating tables", () => {
		const db = new DatabaseSync(":memory:");

		runMigrations(db);
		runMigrations(db);

		expect(userVersion(db)).toBe(latestVersion());
		expect(
			db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all(),
		).toEqual([]);
	});

	it("backfills legacy broadcasters columns and keeps rows", () => {
		const db = new DatabaseSync(":memory:");
		db.exec(`CREATE TABLE broadcasters (
			user_id TEXT PRIMARY KEY,
			login TEXT NOT NULL,
			widget_uuid TEXT NOT NULL UNIQUE,
			token TEXT NOT NULL
		)`);
		db.prepare(
			"INSERT INTO broadcasters (user_id, login, widget_uuid, token) VALUES (?, ?, ?, ?)",
		).run("u1", "alice", "uuid-1", "{}");

		runMigrations(db);

		expect(columns(db, "broadcasters")).toEqual([
			"user_id",
			"login",
			"widget_uuid",
			"token",
			"display_name",
			"widget_key",
		]);
		expect(
			db
				.prepare(
					"SELECT login, display_name FROM broadcasters WHERE user_id = ?",
				)
				.get("u1"),
		).toEqual({ login: "alice", display_name: null });
		expect(userVersion(db)).toBe(latestVersion());
	});

	it("backfills viewers.updated_at and keeps rows readable", () => {
		const db = new DatabaseSync(":memory:");
		db.exec(`CREATE TABLE viewers (
			broadcaster_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			data TEXT NOT NULL,
			PRIMARY KEY (broadcaster_id, user_id)
		)`);
		db.prepare(
			"INSERT INTO viewers (broadcaster_id, user_id, data) VALUES (?, ?, ?)",
		).run("b1", "u1", JSON.stringify({ userId: "u1", xp: 7 }));

		runMigrations(db);

		expect(columns(db, "viewers")).toContain("updated_at");
		expect(
			db
				.prepare("SELECT data, updated_at FROM viewers WHERE user_id = ?")
				.get("u1"),
		).toEqual({
			data: JSON.stringify({ userId: "u1", xp: 7 }),
			updated_at: 0,
		});
	});

	it("keeps tables that already carry the columns", () => {
		const db = new DatabaseSync(":memory:");
		db.exec(`CREATE TABLE viewers (
			broadcaster_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			data TEXT NOT NULL,
			updated_at INTEGER NOT NULL DEFAULT 0,
			PRIMARY KEY (broadcaster_id, user_id)
		)`);

		runMigrations(db);

		expect(userVersion(db)).toBe(latestVersion());
		expect(columns(db, "viewers")).toContain("updated_at");
	});

	it("rolls back a failing step and does not advance its version", () => {
		const db = new DatabaseSync(":memory:");
		const steps: Migration[] = [
			{
				version: 1,
				name: "create",
				up: (database) => {
					database.exec("CREATE TABLE probe (x INTEGER)");
				},
			},
			{
				version: 2,
				name: "boom",
				up: (database) => {
					database.exec("INSERT INTO probe (x) VALUES (1)");
					throw new Error("step failed");
				},
			},
		];

		expect(() => runMigrations(db, steps)).toThrow("step failed");
		expect(userVersion(db)).toBe(1);
		expect(db.prepare("SELECT * FROM probe").all()).toEqual([]);
	});

	it("rejects steps that are not ordered by version", () => {
		const db = new DatabaseSync(":memory:");
		const steps: Migration[] = [
			{ version: 2, name: "second", up: () => undefined },
			{ version: 1, name: "first", up: () => undefined },
		];

		expect(() => runMigrations(db, steps)).toThrow("ordered by version");
		expect(userVersion(db)).toBe(0);
	});
});
