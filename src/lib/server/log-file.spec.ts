import { describe, expect, it } from "vitest";
import { planLogPrune } from "./log-file.js";

const NOW = new Date("2026-10-15T12:00:00.000Z");

describe("planLogPrune", () => {
	it("keeps files within the retention window", () => {
		const files = ["app-2026-10-15.log", "app-2026-10-09.log"];
		expect(planLogPrune(files, NOW, 7)).toEqual([]);
	});

	it("deletes files older than the retention window", () => {
		const files = ["app-2026-10-08.log", "app-2026-10-01.log"];
		expect(planLogPrune(files, NOW, 7)).toEqual([
			"app-2026-10-08.log",
			"app-2026-10-01.log",
		]);
	});

	it("ignores foreign files and malformed names", () => {
		const files = ["app.db", "app-2020-01-01.txt", "app-not-a-date.log"];
		expect(planLogPrune(files, NOW, 7)).toEqual([]);
	});
});
