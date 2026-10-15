import { DatabaseSync } from "node:sqlite";
import type { AccessToken } from "@twurple/auth";
import { describe, expect, it } from "vitest";
import { SqliteBroadcastersRepo } from "./sqlite-adapter.js";

const TOKEN: AccessToken = {
	accessToken: "t",
	expiresIn: 1,
	refreshToken: "r",
	scope: [],
	obtainmentTimestamp: 0,
};

const openRepo = (db = new DatabaseSync(":memory:")) => {
	const repo = new SqliteBroadcastersRepo(db);
	repo.upsert("u1", "alice", null, TOKEN);
	return { db, repo };
};

describe("SqliteBroadcastersRepo", () => {
	it("claims the uuid for the first key and accepts it afterwards", () => {
		const { repo } = openRepo();
		const uuid = repo.byUserId("u1")?.widgetUuid as string;

		expect(repo.claimWidget(uuid, "key-a")).toBe("first");
		expect(repo.claimWidget(uuid, "key-a")).toBe("owner");
	});

	it("rejects a different key once the uuid is claimed", () => {
		const { repo } = openRepo();
		const uuid = repo.byUserId("u1")?.widgetUuid as string;

		repo.claimWidget(uuid, "key-a");

		expect(repo.claimWidget(uuid, "key-b")).toBe("duplicate");
		expect(repo.claimWidget(uuid, "key-a")).toBe("owner");
	});

	it("returns null for an unknown uuid", () => {
		const { repo } = openRepo();

		expect(repo.claimWidget("nope", "key-a")).toBeNull();
	});

	it("rotation frees the old pair and claims the new uuid again", () => {
		const { repo } = openRepo();
		const oldUuid = repo.byUserId("u1")?.widgetUuid as string;
		repo.claimWidget(oldUuid, "key-a");

		const newUuid = repo.rotateUuid("u1");

		expect(newUuid).not.toBe(oldUuid);
		expect(repo.claimWidget(oldUuid, "key-a")).toBeNull();
		expect(repo.claimWidget(newUuid, "key-b")).toBe("first");
	});
});
