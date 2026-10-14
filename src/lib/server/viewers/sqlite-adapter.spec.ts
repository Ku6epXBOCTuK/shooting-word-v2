import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import type { StoredViewer } from "#lib/features/persistence/viewer-store.js";
import { PROFILE_RETENTION_MS, SqliteViewersRepo } from "./sqlite-adapter.js";

const NOW = 1_700_000_000_000;

const profile = (overrides: Partial<StoredViewer> = {}): StoredViewer => ({
	userId: "u1",
	user: "alice",
	login: "alice",
	lastSeen: NOW - 1_000,
	skin: 3,
	xp: 5,
	batteries: 2,
	revives: 1,
	beacons: 0,
	...overrides,
});

const entry = (data: StoredViewer, updatedAt = NOW) => ({
	userId: data.userId,
	data,
	updatedAt,
});

const openRepo = (db = new DatabaseSync(":memory:")) => ({
	db,
	repo: new SqliteViewersRepo(db, () => NOW),
});

describe("SqliteViewersRepo", () => {
	it("migrates the legacy table and keeps its rows readable", () => {
		const db = new DatabaseSync(":memory:");
		db.exec(`CREATE TABLE viewers (
			broadcaster_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			data TEXT NOT NULL,
			PRIMARY KEY (broadcaster_id, user_id)
		)`);
		const legacy = profile({ xp: 7 });
		db.prepare(
			"INSERT INTO viewers (broadcaster_id, user_id, data) VALUES (?, ?, ?)",
		).run("b1", "u1", JSON.stringify(legacy));

		const repo = new SqliteViewersRepo(db, () => NOW);

		expect(repo.load("b1")).toEqual([legacy]);
		repo.upsert("b1", [entry(profile({ xp: 9 }))]);
		expect(repo.get<StoredViewer>("b1", "u1")?.xp).toBe(9);
	});

	it("merges by userId and keeps profiles missing from the payload", () => {
		const { repo } = openRepo();
		repo.upsert("b1", [
			entry(profile()),
			entry(profile({ userId: "u2", user: "bob", login: "bob" })),
		]);

		repo.upsert("b1", [entry(profile({ xp: 9 }), NOW + 1)]);

		expect(repo.load("b1")).toHaveLength(2);
		expect(repo.get<StoredViewer>("b1", "u1")?.xp).toBe(9);
		expect(repo.get<StoredViewer>("b1", "u2")?.xp).toBe(5);
	});

	it("rejects a write with an older version and accepts a newer one", () => {
		const { repo } = openRepo();
		repo.upsert("b1", [entry(profile({ xp: 9 }), NOW + 10)]);

		repo.upsert("b1", [entry(profile({ xp: 1 }), NOW)]);
		expect(repo.get<StoredViewer>("b1", "u1")?.xp).toBe(9);

		repo.upsert("b1", [entry(profile({ xp: 2 }), NOW + 11)]);
		expect(repo.get<StoredViewer>("b1", "u1")?.xp).toBe(2);
	});

	it("isolates broadcasters", () => {
		const { repo } = openRepo();
		repo.upsert("b1", [entry(profile({ xp: 1 }))]);
		repo.upsert("b2", [entry(profile({ xp: 2 }))]);

		expect(repo.get<StoredViewer>("b1", "u1")?.xp).toBe(1);
		expect(repo.get<StoredViewer>("b2", "u1")?.xp).toBe(2);
		expect(repo.load("b3")).toEqual([]);
	});

	it("increments a consumable and creates the profile on demand", () => {
		const { repo } = openRepo();

		expect(
			repo.increment("b1", "u1", "batteries", 1, 5, { user: "Alice" }),
		).toBe(1);
		expect(
			repo.increment("b1", "u1", "batteries", 1, 5, { user: "Alice" }),
		).toBe(2);

		expect(repo.get<StoredViewer>("b1", "u1")).toEqual(
			expect.objectContaining({
				userId: "u1",
				user: "Alice",
				login: "alice",
				batteries: 2,
			}),
		);
	});

	it("respects the cap", () => {
		const { repo } = openRepo();

		repo.increment("b1", "u1", "batteries", 1, 1, { user: "alice" });
		expect(
			repo.increment("b1", "u1", "batteries", 1, 1, { user: "alice" }),
		).toBe(1);
	});

	it("increment wins over a snapshot with a clock ahead", () => {
		const { repo } = openRepo();
		repo.upsert("b1", [entry(profile({ batteries: 1 }), NOW + 60_000)]);

		expect(
			repo.increment("b1", "u1", "batteries", 1, 5, { user: "alice" }),
		).toBe(2);
		expect(repo.get<StoredViewer>("b1", "u1")?.batteries).toBe(2);
	});

	it("purges bots, broken rows and expired profiles on open", () => {
		const db = new DatabaseSync(":memory:");
		const { repo } = openRepo(db);
		repo.upsert("b1", [
			entry(profile({ userId: "fresh" })),
			entry(
				profile({
					userId: "old",
					lastSeen: NOW - PROFILE_RETENTION_MS - 1,
				}),
			),
			entry(profile({ userId: "bot-1", bot: true })),
		]);
		db.prepare(
			"INSERT INTO viewers (broadcaster_id, user_id, data) VALUES (?, ?, ?)",
		).run("b1", "broken", "not json");

		const reopened = new SqliteViewersRepo(db, () => NOW);

		expect(reopened.load("b1")).toEqual([
			expect.objectContaining({ userId: "fresh" }),
		]);
	});
});
