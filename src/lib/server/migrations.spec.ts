import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import type { Migration } from "./migrations.js";
import { migrations, runMigrations } from "./migrations.js";

const latestVersion = (): number =>
	migrations[migrations.length - 1]?.version ?? 0;

const userVersion = (db: DatabaseSync): number =>
	(db.prepare("PRAGMA user_version").get() as { user_version: number })
		.user_version;

const schemaObjects = (db: DatabaseSync, type: string): string[] =>
	(
		db.prepare("SELECT name FROM sqlite_master WHERE type = ?").all(type) as {
			name: string;
		}[]
	)
		.map((row) => row.name)
		.filter((name) => !name.startsWith("sqlite_"));

describe("runMigrations", () => {
	it("creates the full schema on a fresh database", () => {
		const db = new DatabaseSync(":memory:");

		runMigrations(db);

		expect(userVersion(db)).toBe(latestVersion());
		expect(schemaObjects(db, "table").sort()).toEqual([
			"broadcasters",
			"reward_ids",
			"reward_settings",
			"rounds",
			"sessions",
			"settings",
			"viewers",
		]);
		expect(schemaObjects(db, "index")).toContain("rounds_broadcaster");
	});

	it("is a no-op when run again", () => {
		const db = new DatabaseSync(":memory:");

		runMigrations(db);
		runMigrations(db);

		expect(userVersion(db)).toBe(latestVersion());
		expect(schemaObjects(db, "table")).toHaveLength(7);
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
