import type { ApiClient } from "@twurple/api";
import { describe, expect, it, vi } from "vitest";
import { deleteRewardWithRefund, refundUnfulfilled } from "./reward-delete.js";

interface Page {
	data: { id: string }[];
	cursor?: string;
}

function fakeApi(pages: Page[] = []) {
	const reads: unknown[][] = [];
	const updates: unknown[][] = [];
	const deleted: string[] = [];
	let page = 0;

	const api = {
		channelPoints: {
			getRedemptionsForBroadcaster: vi.fn(async (...args: unknown[]) => {
				reads.push(args);
				return pages[page++];
			}),
			updateRedemptionStatusByIds: vi.fn(async (...args: unknown[]) => {
				updates.push(args);
				return [];
			}),
			deleteCustomReward: vi.fn(async (_user: string, id: string) => {
				deleted.push(id);
			}),
		},
	} as unknown as ApiClient;

	return { api, reads, updates, deleted };
}

const redemption = (id: string) => ({ id });

describe("refundUnfulfilled", () => {
	it("returns 0 when there are no unfulfilled redemptions", async () => {
		const { api, updates } = fakeApi([{ data: [] }]);

		expect(await refundUnfulfilled(api, "u1", "r1")).toBe(0);
		expect(updates).toHaveLength(0);
	});

	it("cancels unfulfilled redemptions to refund points", async () => {
		const { api, updates } = fakeApi([
			{ data: [redemption("a"), redemption("b")] },
		]);

		expect(await refundUnfulfilled(api, "u1", "r1")).toBe(2);
		expect(updates).toEqual([["u1", "r1", ["a", "b"], "CANCELED"]]);
	});

	it("walks every page using the cursor", async () => {
		const { api, reads, updates } = fakeApi([
			{ data: [redemption("a")], cursor: "next" },
			{ data: [redemption("b")] },
		]);

		expect(await refundUnfulfilled(api, "u1", "r1")).toBe(2);
		expect(reads).toHaveLength(2);
		expect(reads[0]).toEqual(["u1", "r1", "UNFULFILLED", {}]);
		expect(reads[1]).toEqual(["u1", "r1", "UNFULFILLED", { after: "next" }]);
		expect(updates).toEqual([["u1", "r1", ["a", "b"], "CANCELED"]]);
	});

	it("splits refunds into batches of 50", async () => {
		const ids = Array.from({ length: 120 }, (_, index) => `id-${index}`);
		const { api, updates } = fakeApi([{ data: ids.map(redemption) }]);

		expect(await refundUnfulfilled(api, "u1", "r1")).toBe(120);
		expect(updates).toHaveLength(3);
		expect(updates.map((call) => (call[2] as string[]).length)).toEqual([
			50, 50, 20,
		]);
	});
});

describe("deleteRewardWithRefund", () => {
	it("deletes without touching redemptions when refund is off", async () => {
		const { api, reads, updates, deleted } = fakeApi([{ data: [] }]);

		expect(await deleteRewardWithRefund(api, "u1", "r1", false)).toBe(0);
		expect(reads).toHaveLength(0);
		expect(updates).toHaveLength(0);
		expect(deleted).toEqual(["r1"]);
	});

	it("refunds before deleting when refund is on", async () => {
		const { api, updates, deleted } = fakeApi([{ data: [redemption("a")] }]);

		expect(await deleteRewardWithRefund(api, "u1", "r1", true)).toBe(1);
		expect(updates).toHaveLength(1);
		expect(deleted).toEqual(["r1"]);
	});
});
