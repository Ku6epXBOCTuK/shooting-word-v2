import { isHttpError } from "@sveltejs/kit";
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
	},
}));

const event = (target: string, key?: string) => ({
	cookies: {} as never,
	url: new URL(`http://localhost${target}`),
	request: new Request(`http://localhost${target}`, {
		method: "PUT",
		headers: key ? { "x-widget-key": key } : {},
	}),
});

const rejection = (target: string, key?: string) => {
	try {
		requireWidgetWriter(event(target, key));
	} catch (thrown) {
		if (isHttpError(thrown)) return thrown;
		throw thrown;
	}
	throw new Error("requireWidgetWriter did not throw");
};

describe("requireWidgetWriter", () => {
	it("lets the cabinet session through without a key", () => {
		session.mockReturnValueOnce(broadcaster);

		const result = requireWidgetWriter(event("/api/settings?uuid=w1"));

		expect(result).toBe(broadcaster);
		expect(claim).not.toHaveBeenCalled();
	});

	it("rejects a write without a uuid", () => {
		session.mockReturnValueOnce(null);

		expect(rejection("/api/settings")).toMatchObject({
			status: 404,
			body: { message: "unknown widget" },
		});
	});

	it("rejects a write without a key", () => {
		session.mockReturnValueOnce(null);

		expect(rejection("/api/settings?uuid=w1")).toMatchObject({ status: 403 });
	});

	it("accepts the owner key and returns the broadcaster", () => {
		session.mockReturnValueOnce(null);
		claim.mockReturnValueOnce({ claim: "owner", broadcaster });

		const result = requireWidgetWriter(event("/api/settings?uuid=w1", "key-a"));

		expect(result).toBe(broadcaster);
	});

	it("rejects a foreign key", () => {
		session.mockReturnValueOnce(null);
		claim.mockReturnValueOnce({ claim: "duplicate", broadcaster });

		expect(rejection("/api/settings?uuid=w1", "key-b")).toMatchObject({
			status: 403,
		});
	});

	it("rejects an unknown uuid", () => {
		session.mockReturnValueOnce(null);
		claim.mockReturnValueOnce(null);

		expect(rejection("/api/settings?uuid=w1", "key-a")).toMatchObject({
			status: 404,
		});
	});
});
