import { describe, expect, it } from "vitest";
import { shouldReload } from "./version.js";

describe("shouldReload", () => {
	it("does not reload when both versions are dev", () => {
		expect(shouldReload("dev", "dev")).toBe(false);
	});

	it("does not reload when the server version is missing", () => {
		expect(shouldReload(undefined, "abc1234")).toBe(false);
	});

	it("does not reload when the server version is dev", () => {
		expect(shouldReload("dev", "abc1234")).toBe(false);
	});

	it("does not reload when the client version is dev", () => {
		expect(shouldReload("abc1234", "dev")).toBe(false);
	});

	it("does not reload when versions are equal", () => {
		expect(shouldReload("abc1234", "abc1234")).toBe(false);
	});

	it("reloads when real versions differ", () => {
		expect(shouldReload("abc1234", "def5678")).toBe(true);
	});
});
