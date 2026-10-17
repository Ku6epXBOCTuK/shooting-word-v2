import { describe, expect, it, vi } from "vitest";
import type { Broadcaster } from "./broadcasters/index.js";
import { requireWidgetWriter } from "./widget-writer.js";

const broadcaster: Broadcaster = {
	userId: "u1",
	login: "alice",
	displayName: null,
	widgetUuid: "w1",
	token: {
		accessToken: "t",
		expiresIn: 1,
		refreshToken: "r",
		scope: [],
		obtainmentTimestamp: 0,
	},
};

const session = vi.fn();
const claim = vi.fn();

vi.mock("./resolve-broadcaster.js", () => ({
	sessionBroadcaster: (cookies: unknown) => session(cookies),
}));

vi.mock("./broadcasters/index.js", () => ({
	broadcasters: {
		claimWidget: (uuid: string, key: string) => claim(uuid, key),
		byUuid: () => broadcaster,
	},
}));

const cookies = {} as never;
const request = (key?: string) =>
	new Request("http://localhost/api/reward-settings?uuid=w1", {
		method: "PUT",
		headers: key ? { "x-widget-key": key } : {},
	});

describe("requireWidgetWriter", () => {
	it("lets the cabinet session through without a key", () => {
		session.mockReturnValueOnce(broadcaster);

		const result = requireWidgetWriter(
			cookies,
			new URL(request().url),
			request(),
		);

		expect(result).toBe(broadcaster);
		expect(claim).not.toHaveBeenCalled();
	});

	it("rejects a write without a key", () => {
		session.mockReturnValueOnce(null);

		const result = requireWidgetWriter(
			cookies,
			new URL(request().url),
			request(),
		);

		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(403);
	});

	it("accepts the owner key and returns the broadcaster", () => {
		session.mockReturnValueOnce(null);
		claim.mockReturnValueOnce("owner");

		const result = requireWidgetWriter(
			cookies,
			new URL(request("key-a").url),
			request("key-a"),
		);

		expect(result).toBe(broadcaster);
	});

	it("rejects a foreign key", () => {
		session.mockReturnValueOnce(null);
		claim.mockReturnValueOnce("duplicate");

		const result = requireWidgetWriter(
			cookies,
			new URL(request("key-b").url),
			request("key-b"),
		);

		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(403);
	});

	it("returns 404 when the uuid is unknown", () => {
		session.mockReturnValueOnce(null);
		claim.mockReturnValueOnce(null);

		const result = requireWidgetWriter(
			cookies,
			new URL(request("key-a").url),
			request("key-a"),
		);

		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(404);
	});
});
