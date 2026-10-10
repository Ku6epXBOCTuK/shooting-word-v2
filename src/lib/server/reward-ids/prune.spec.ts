import { describe, expect, it } from "vitest";
import { planRewardPrune } from "./prune.js";

const VALID_KEYS = new Set(["shield", "battery"]);

describe("planRewardPrune", () => {
	it("keeps rewards whose id is stored under a valid key", () => {
		const plan = planRewardPrune(
			[{ key: "shield", rewardId: "r1" }],
			VALID_KEYS,
			["r1"],
		);
		expect(plan).toEqual({ deleteIds: [], staleKeys: [] });
	});

	it("deletes duplicates of a valid-key reward not stored in reward_ids", () => {
		const plan = planRewardPrune(
			[{ key: "shield", rewardId: "r1" }],
			VALID_KEYS,
			["r1", "r2"],
		);
		expect(plan.deleteIds).toEqual(["r2"]);
		expect(plan.staleKeys).toEqual([]);
	});

	it("deletes rewards of stale keys and reports their keys", () => {
		const plan = planRewardPrune(
			[{ key: "old-reward", rewardId: "r9" }],
			VALID_KEYS,
			["r9"],
		);
		expect(plan.deleteIds).toEqual(["r9"]);
		expect(plan.staleKeys).toEqual(["old-reward"]);
	});

	it("deletes all manageable rewards when reward_ids is empty", () => {
		const plan = planRewardPrune([], VALID_KEYS, ["r1", "r2"]);
		expect(plan.deleteIds).toEqual(["r1", "r2"]);
		expect(plan.staleKeys).toEqual([]);
	});

	it("ignores rewards created outside the app (not in manageable list)", () => {
		const plan = planRewardPrune([], VALID_KEYS, []);
		expect(plan.deleteIds).toEqual([]);
	});
});
