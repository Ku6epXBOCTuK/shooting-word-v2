import { describe, expect, it } from "vitest";
import { frameRect, parseFrameLabel } from "./frame-label.js";

describe("parseFrameLabel", () => {
	it("parses single-letter rows", () => {
		expect(parseFrameLabel("a1")).toEqual({ row: 1, col: 1 });
		expect(parseFrameLabel("b3")).toEqual({ row: 2, col: 3 });
		expect(parseFrameLabel("m36")).toEqual({ row: 13, col: 36 });
	});

	it("rejects invalid labels", () => {
		expect(() => parseFrameLabel("")).toThrow();
		expect(() => parseFrameLabel("3b")).toThrow();
		expect(() => parseFrameLabel("b0")).toThrow();
	});
});

describe("frameRect", () => {
	it("maps label to pixel rect", () => {
		expect(frameRect("a1")).toEqual([0, 0, 16, 16]);
		expect(frameRect("b3")).toEqual([32, 16, 16, 16]);
	});
});
