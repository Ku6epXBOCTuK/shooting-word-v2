import { describe, expect, it, vi } from "vitest";
import { claimWidget, getOrCreateWidgetKey } from "./key.js";

const storage: Record<string, string> = {};

vi.stubGlobal("localStorage", {
	getItem: vi.fn((key: string) => (key in storage ? storage[key] : null)),
	setItem: vi.fn((key: string, value: string) => {
		storage[key] = value;
	}),
	removeItem: vi.fn((key: string) => {
		delete storage[key];
	}),
});

describe("getOrCreateWidgetKey", () => {
	it("returns the stored key for the same uuid", () => {
		localStorage.setItem("sw-widget-key:u1", "stored-key");
		expect(getOrCreateWidgetKey("u1")).toBe("stored-key");
	});

	it("generates a fresh key the first time", () => {
		localStorage.removeItem("sw-widget-key:u1");
		const key = getOrCreateWidgetKey("u1");
		expect(key).toBeDefined();
		expect(localStorage.getItem("sw-widget-key:u1")).toBe(key);
		const again = getOrCreateWidgetKey("u1");
		expect(again).toBe(key);
		const other = getOrCreateWidgetKey("u2");
		expect(other).not.toBe(key);
	});
});

describe("claimWidget", () => {
	it("returns owner for the first request", async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ status: "owner" }),
		}) as unknown as typeof fetch;
		globalThis.fetch = fetchMock;

		const result = await claimWidget("u1", "key-a");

		expect(result).toBe("owner");
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining("/api/widget/claim"),
			expect.objectContaining({
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ uuid: "u1", key: "key-a" }),
			}),
		);
	});

	it("returns duplicate when the same uuid is claimed with another key", async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: () => Promise.resolve({ status: "duplicate" }),
		}) as unknown as typeof fetch;
		globalThis.fetch = fetchMock;

		const result = await claimWidget("u1", "key-b");

		expect(result).toBe("duplicate");
	});

	it("returns notFound for an unknown uuid", async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: false,
			status: 404,
		} as Response) as unknown as typeof fetch;
		globalThis.fetch = fetchMock;

		const result = await claimWidget("u1", "key-a");

		expect(result).toBe("notFound");
	});
});
