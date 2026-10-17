import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import {
	ROUND_OUTCOME,
	type RoundRecord,
} from "#lib/features/rounds/record.js";
import { migrateDb } from "../db-test-utils.js";
import {
	ROUNDS_KEPT_PER_BROADCASTER,
	SqliteRoundsRepo,
} from "./sqlite-adapter.js";

const record = (overrides: Partial<RoundRecord> = {}): RoundRecord => ({
	startedAt: 1_700_000_000_000,
	durationSec: 123.4,
	outcome: ROUND_OUTCOME.WIPE,
	afk: false,
	viewers: 30,
	deaths: 30,
	revives: 4,
	wordsSpawned: 400,
	wordsExpired: 120,
	maxEnemies: 63,
	kills: 280,
	misses: 7,
	heals: 5,
	doomsday: 1,
	avgEnemies: 42.5,
	avgHpFraction: 0.61,
	...overrides,
});

describe("SqliteRoundsRepo", () => {
	let repo: SqliteRoundsRepo;

	beforeEach(async () => {
		const db = new DatabaseSync(":memory:");
		await migrateDb(db);
		repo = new SqliteRoundsRepo(db);
	});

	it("stores and reads a round without losing fields", () => {
		const source = record();
		repo.add("b1", source);
		expect(repo.recent("b1", 10)).toEqual([source]);
	});

	it("keeps outcome and afk flag apart", () => {
		repo.add("b1", record({ outcome: ROUND_OUTCOME.EMPTY, afk: true }));
		const [stored] = repo.recent("b1", 10);
		expect(stored.outcome).toBe(ROUND_OUTCOME.EMPTY);
		expect(stored.afk).toBe(true);
	});

	it("returns newest rounds first", () => {
		repo.add("b1", record({ durationSec: 1 }));
		repo.add("b1", record({ durationSec: 2 }));
		repo.add("b1", record({ durationSec: 3 }));
		expect(repo.recent("b1", 10).map((entry) => entry.durationSec)).toEqual([
			3, 2, 1,
		]);
	});

	it("respects limit", () => {
		for (let i = 0; i < 5; i++) repo.add("b1", record({ durationSec: i }));
		expect(repo.recent("b1", 2)).toHaveLength(2);
	});

	it("isolates broadcasters", () => {
		repo.add("b1", record({ durationSec: 10 }));
		repo.add("b2", record({ durationSec: 20 }));
		expect(repo.recent("b1", 10).map((entry) => entry.durationSec)).toEqual([
			10,
		]);
		expect(repo.recent("b3", 10)).toEqual([]);
	});

	it("prunes old rounds beyond the per-broadcaster cap", () => {
		for (let i = 0; i < ROUNDS_KEPT_PER_BROADCASTER + 3; i++) {
			repo.add("b1", record({ startedAt: i }));
		}
		const stored = repo.recent("b1", ROUNDS_KEPT_PER_BROADCASTER + 10);
		expect(stored).toHaveLength(ROUNDS_KEPT_PER_BROADCASTER);
		expect(stored[0].startedAt).toBe(ROUNDS_KEPT_PER_BROADCASTER + 2);
	});
});
