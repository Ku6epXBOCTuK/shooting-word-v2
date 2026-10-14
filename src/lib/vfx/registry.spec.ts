import { describe, expect, test } from "vitest";
import {
	ALL_AURA_KINDS,
	ALL_COATING_KINDS,
	REGISTERED_AURA_KINDS,
	REGISTERED_COATING_KINDS,
} from "./registry.js";

describe("vfx registry", () => {
	test("все зарегистрированные ауры известны сцене", () => {
		expect(
			REGISTERED_AURA_KINDS.filter(
				(kind) => !ALL_AURA_KINDS.includes(kind as never),
			),
		).toEqual([]);
	});

	test("все зарегистрированные покрытия известны сцене", () => {
		expect(REGISTERED_COATING_KINDS).toContain("ricochetium");
		expect(
			REGISTERED_COATING_KINDS.filter(
				(kind) => !ALL_COATING_KINDS.includes(kind as never),
			),
		).toEqual([]);
	});

	test("ауры и покрытия не пересекаются", () => {
		const overlap = ALL_AURA_KINDS.filter((kind) =>
			(ALL_COATING_KINDS as readonly string[]).includes(kind),
		);
		expect(overlap).toEqual([]);
	});
});
