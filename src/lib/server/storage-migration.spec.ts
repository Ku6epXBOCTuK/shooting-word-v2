import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { migrateStorageTables } from "./storage-migration.js";

function createLegacyStorage(db: DatabaseSync): void {
	db.exec(`CREATE TABLE storage (
		broadcaster_id TEXT NOT NULL,
		key TEXT NOT NULL,
		data TEXT NOT NULL,
		PRIMARY KEY (broadcaster_id, key)
	)`);
}

function tableExists(db: DatabaseSync, name: string): boolean {
	return (
		(db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
			)
			.get(name) as { name: string } | undefined) !== undefined
	);
}

describe("migrateStorageTables", () => {
	it("copies settings and rewards rows into per-entity tables and drops storage", () => {
		const db = new DatabaseSync(":memory:");
		createLegacyStorage(db);
		const insert = db.prepare(
			"INSERT INTO storage (broadcaster_id, key, data) VALUES (?, ?, ?)",
		);
		insert.run("b1", "settings", JSON.stringify({ batteryMax: 5 }));
		insert.run("b1", "rewards", JSON.stringify({ battery: { cost: 10 } }));
		insert.run("b2", "settings", JSON.stringify({ batteryMax: 9 }));

		migrateStorageTables(db);

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

		migrateStorageTables(db);
		migrateStorageTables(db);

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

		migrateStorageTables(db);

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

		migrateStorageTables(db);

		expect(db.prepare("SELECT * FROM settings").all()).toEqual([]);
		expect(db.prepare("SELECT * FROM reward_settings").all()).toEqual([]);
		expect(tableExists(db, "storage")).toBe(false);
	});
});
