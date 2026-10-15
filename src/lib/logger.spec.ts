import { describe, expect, it, vi } from "vitest";
import {
	addLogSink,
	formatLine,
	logger,
	parseLevel,
	resolveLevel,
} from "./logger.js";

describe("parseLevel", () => {
	it("parses known levels case-insensitively", () => {
		expect(parseLevel("DEBUG")).toBe("debug");
		expect(parseLevel(" info ")).toBe("info");
		expect(parseLevel("silent")).toBe("silent");
	});

	it("returns null for unknown or missing values", () => {
		expect(parseLevel(undefined)).toBeNull();
		expect(parseLevel("")).toBeNull();
		expect(parseLevel("verbose")).toBeNull();
	});
});

describe("resolveLevel", () => {
	it("uses debug in dev regardless of env", () => {
		expect(resolveLevel(true, true, "silent")).toBe("debug");
	});

	it("prefers LOG_LEVEL when set in prod", () => {
		expect(resolveLevel(false, true, "warn")).toBe("warn");
		expect(resolveLevel(false, false, "warn")).toBe("warn");
	});

	it("defaults to info on the server and error in the browser", () => {
		expect(resolveLevel(false, true, undefined)).toBe("info");
		expect(resolveLevel(false, false, undefined)).toBe("error");
	});
});

describe("formatLine", () => {
	it("formats a timestamped level line", () => {
		expect(formatLine("info", ["hello"])).toMatch(
			/^\d{4}-\d{2}-\d{2}T\S+ INFO hello$/,
		);
	});

	it("serializes errors via stack and objects via json", () => {
		const line = formatLine("error", [new Error("boom"), { a: 1 }]);
		expect(line).toContain("Error: boom");
		expect(line).toContain('{"a":1}');
	});
});

describe("logger", () => {
	it("writes formatted lines to registered sinks", () => {
		const sink = vi.fn();
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		addLogSink(sink);
		logger.warn("payload", 42);
		expect(sink).toHaveBeenCalledOnce();
		expect(sink).toHaveBeenCalledWith(
			expect.stringContaining("WARN payload 42"),
		);
		expect(warn).toHaveBeenCalledWith("payload", 42);
	});
});
