import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import { SqliteRewardIdsRepo } from "./sqlite-adapter.js";

describe("SqliteRewardIdsRepo", () => {
	let repo: SqliteRewardIdsRepo;

	beforeEach(() => {
		repo = new SqliteRewardIdsRepo(new DatabaseSync(":memory:"));
	});

	it("returns null for missing entry", () => {
		expect(repo.get("b1", "shield")).toBeNull();
	});

	it("sets and gets reward id", () => {
		repo.set("b1", "shield", "r1");
		expect(repo.get("b1", "shield")).toBe("r1");
	});

	it("overwrites existing entry", () => {
		repo.set("b1", "shield", "r1");
		repo.set("b1", "shield", "r2");
		expect(repo.get("b1", "shield")).toBe("r2");
	});

	it("lists entries for broadcaster only", () => {
		repo.set("b1", "shield", "r1");
		repo.set("b1", "battery", "r2");
		repo.set("b2", "shield", "r3");
		const entries = repo.list("b1");
		expect(entries).toHaveLength(2);
		expect(entries).toEqual(
			expect.arrayContaining([
				{ key: "shield", rewardId: "r1" },
				{ key: "battery", rewardId: "r2" },
			]),
		);
	});

	it("removes a single entry", () => {
		repo.set("b1", "shield", "r1");
		repo.set("b1", "battery", "r2");
		repo.remove("b1", "shield");
		expect(repo.get("b1", "shield")).toBeNull();
		expect(repo.get("b1", "battery")).toBe("r2");
	});

	it("remove is a no-op for missing entry", () => {
		expect(() => repo.remove("b1", "shield")).not.toThrow();
	});

	it("clears all entries for broadcaster", () => {
		repo.set("b1", "shield", "r1");
		repo.set("b1", "battery", "r2");
		repo.set("b2", "shield", "r3");
		repo.clear("b1");
		expect(repo.list("b1")).toEqual([]);
		expect(repo.get("b2", "shield")).toBe("r3");
	});
});
