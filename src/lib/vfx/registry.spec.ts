import { describe, expect, test } from "vitest";
import {
	ALL_AURA_KINDS,
	ALL_COATING_KINDS,
	REGISTERED_AURA_KINDS,
	REGISTERED_COATING_KINDS,
} from "./registry.js";
import type { AuraStates } from "./types.js";

const AURA_STATES: AuraStates = {
	shield: { hp: 0, max: 0, radius: 0, hit: 0, hitDir: { x: 0, y: 1 } },
	overcharge: { radius: 0 },
	doomsday: { active: false, shooter: null, shooterRadius: 0 },
	portal: { progress: 0, groundY: 0 },
};

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

	test("у каждой зарегистрированной ауры есть состояние в AuraStates", () => {
		expect(REGISTERED_AURA_KINDS.sort()).toEqual(
			(Object.keys(AURA_STATES) as string[]).sort(),
		);
	});

	test("в AURA_KINDS нет вида без состояния и без фабрики", () => {
		const withoutState = ALL_AURA_KINDS.filter(
			(kind) => !(kind in AURA_STATES),
		);
		const withoutFactory = ALL_AURA_KINDS.filter(
			(kind) => !REGISTERED_AURA_KINDS.includes(kind),
		);
		expect(withoutState).toEqual([]);
		expect(withoutFactory).toEqual([]);
	});
});
