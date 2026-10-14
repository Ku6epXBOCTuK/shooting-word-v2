import { describe, expect, test } from "vitest";
import { REACTION_KINDS } from "./kinds.js";
import { REACTION_DURATION } from "./durations.js";
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

	test("у каждого вида отклика есть срок жизни", () => {
		expect(REACTION_KINDS.every((kind) => REACTION_DURATION[kind] > 0)).toBe(
			true,
		);
		expect(Object.keys(REACTION_DURATION).sort()).toEqual(
			[...REACTION_KINDS].sort(),
		);
	});
});
