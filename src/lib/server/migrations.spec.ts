import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { migrateDb } from "./db-test-utils.js";

const schemaObjects = (db: DatabaseSync, type: string): string[] =>
	(
		db.prepare("SELECT name FROM sqlite_master WHERE type = ?").all(type) as {
			name: string;
		}[]
	)
		.map((row) => row.name)
		.filter((name) => !name.startsWith("sqlite_"));

describe("migrateDb", () => {
	it("creates the full schema on a fresh database", async () => {
		const db = new DatabaseSync(":memory:");

		await migrateDb(db);

		expect(schemaObjects(db, "table")).toEqual(
			expect.arrayContaining([
				"broadcasters",
				"reward_ids",
				"reward_settings",
				"rounds",
				"sessions",
				"settings",
				"viewers",
				"schema_migrations",
				"schema_migrations_lock",
			]),
		);
		expect(schemaObjects(db, "index")).toContain("rounds_broadcaster");
	});

	it("records applied migrations and is a no-op on the second run", async () => {
		const db = new DatabaseSync(":memory:");

		await migrateDb(db);
		await migrateDb(db);

		expect(db.prepare("SELECT name FROM schema_migrations").all()).toEqual([
			{ name: "001_initial_schema.js" },
		]);
		expect(schemaObjects(db, "table")).toHaveLength(9);
	});
});
