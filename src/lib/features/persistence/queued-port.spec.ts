import { describe, expect, it } from "vitest";
import { QueuedStoragePort } from "./queued-port.js";

class TestPort extends QueuedStoragePort {
	writes: unknown[] = [];
	maxConcurrent = 0;
	private active = 0;

	protected async read(key: string): Promise<unknown> {
		return `stored:${key}`;
	}

	protected async write(_key: string, value: unknown): Promise<void> {
		this.active += 1;
		this.maxConcurrent = Math.max(this.maxConcurrent, this.active);
		await Promise.resolve();
		this.writes.push(value);
		this.active -= 1;
	}
}

describe("QueuedStoragePort", () => {
	it("sends only the latest snapshot of a burst", async () => {
		const port = new TestPort();

		await Promise.all([
			port.save("viewers", 1),
			port.save("viewers", 2),
			port.save("viewers", 3),
		]);

		expect(port.writes).toEqual([3]);
		expect(port.maxConcurrent).toBe(1);
	});

	it("delegates reads to the transport", async () => {
		const port = new TestPort();

		expect(await port.load("settings")).toBe("stored:settings");
	});

	it("keeps writing after the queue drained", async () => {
		const port = new TestPort();

		await port.save("viewers", 1);
		await port.save("viewers", 2);

		expect(port.writes).toEqual([1, 2]);
		expect(port.maxConcurrent).toBe(1);
	});
});
