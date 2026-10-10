import { expect, test } from "vitest";
import {
	bumpRoundStat,
	createRoundStats,
	formatRoundStats,
} from "./round-stats.js";

test("bumpRoundStat counts per user and refreshes name", () => {
	const stats = createRoundStats();
	bumpRoundStat(stats, "kills", "u1", "alice");
	bumpRoundStat(stats, "kills", "u1", "Alice");
	bumpRoundStat(stats, "kills", "u2", "bob");

	expect(stats.kills.u1).toEqual({ user: "Alice", count: 2 });
	expect(stats.kills.u2).toEqual({ user: "bob", count: 1 });
});

test("formatRoundStats is empty without events", () => {
	expect(formatRoundStats(createRoundStats())).toBe("");
});

test("formatRoundStats shows top 3 kills, top misser, top healer", () => {
	const stats = createRoundStats();
	for (const [userId, user, count] of [
		["u1", "alice", 5],
		["u2", "bob", 4],
		["u3", "carol", 3],
		["u4", "dave", 2],
	] as const) {
		for (let i = 0; i < count; i++) bumpRoundStat(stats, "kills", userId, user);
	}
	bumpRoundStat(stats, "misses", "u4", "dave");
	bumpRoundStat(stats, "heals", "u2", "bob");
	bumpRoundStat(stats, "heals", "u2", "bob");

	expect(formatRoundStats(stats)).toBe(
		"\nсбито слов: alice — 5, bob — 4, carol — 3" +
			"\nпромахи: dave — 1" +
			"\nпочинка: bob — 2",
	);
});
