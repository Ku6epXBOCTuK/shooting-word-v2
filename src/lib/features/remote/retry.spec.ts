import { error } from "@sveltejs/kit";
import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./retry.js";

const appError = (status: number): unknown => {
	try {
		error(status, "boom");
	} catch (thrown) {
		return thrown;
	}
	return undefined;
};

describe("withRetry", () => {
	it("returns the result of the first attempt", async () => {
		const run = vi.fn().mockResolvedValue("ok");

		await expect(withRetry(run, { delayMs: 1 })).resolves.toBe("ok");
		expect(run).toHaveBeenCalledTimes(1);
	});

	it("replays a transient failure", async () => {
		const run = vi
			.fn()
			.mockRejectedValueOnce(new Error("network"))
			.mockResolvedValue("ok");

		await expect(withRetry(run, { delayMs: 1 })).resolves.toBe("ok");
		expect(run).toHaveBeenCalledTimes(2);
	});

	it("does not replay an app error below 500", async () => {
		const forbidden = appError(403);
		const run = vi.fn().mockRejectedValue(forbidden);

		await expect(withRetry(run, { delayMs: 1 })).rejects.toBe(forbidden);
		expect(run).toHaveBeenCalledTimes(1);
	});

	it("gives up after the configured attempts", async () => {
		const run = vi.fn().mockRejectedValue(new Error("network"));

		await expect(withRetry(run, { attempts: 3, delayMs: 1 })).rejects.toThrow(
			"network",
		);
		expect(run).toHaveBeenCalledTimes(3);
	});

	it("gives up on a call that outlives the timeout", async () => {
		const run = vi.fn(() => new Promise<never>(() => {}));

		await expect(withRetry(run, { attempts: 1, timeoutMs: 5 })).rejects.toThrow(
			"timed out",
		);
	});
});
