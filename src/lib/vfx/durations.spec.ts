import { describe, expect, test } from "vitest";
import { REACTION_KINDS } from "./kinds.js";
import {
	EXPLOSION_DURATION,
	REACTION_DURATION,
	SHIELD_HIT_DECAY_MS,
	shieldHit,
} from "./durations.js";

describe("сроки откликов", () => {
	test("у каждого вида отклика есть срок жизни", () => {
		expect(Object.keys(REACTION_DURATION).sort()).toEqual(
			[...REACTION_KINDS].sort(),
		);
		expect(REACTION_KINDS.every((kind) => REACTION_DURATION[kind] > 0)).toBe(
			true,
		);
	});

	test("взрыв живёт столько, сколько идёт его кадров", () => {
		expect(REACTION_DURATION["word-destroyed"]).toBe(EXPLOSION_DURATION);
	});
});

describe("искажение щита от попадания", () => {
	const at = { x: 100, y: 50 };

	test("без попадания искажения нет", () => {
		expect(shieldHit({}, at, 10_000).hit).toBe(0);
	});

	test("в момент попадания искажение максимальное", () => {
		const now = 10_000;
		expect(
			shieldHit({ hitAt: now, hitFrom: { x: 0, y: 0 } }, at, now).hit,
		).toBe(1);
	});

	test("искажение гаснет линейно за отведённое время", () => {
		const now = 10_000;
		const hitFrom = { x: 0, y: 0 };
		expect(
			shieldHit({ hitAt: now, hitFrom }, at, now + SHIELD_HIT_DECAY_MS / 2).hit,
		).toBeCloseTo(0.5);
		expect(
			shieldHit({ hitAt: now, hitFrom }, at, now + SHIELD_HIT_DECAY_MS).hit,
		).toBe(0);
		expect(
			shieldHit({ hitAt: now, hitFrom }, at, now + SHIELD_HIT_DECAY_MS * 10)
				.hit,
		).toBe(0);
	});

	test("направление идёт от точки удара к кораблю", () => {
		const from = { x: 0, y: 0 };
		const hit = shieldHit({ hitAt: 1, hitFrom: from }, at, 1);
		expect(hit.hitDir.x).toBeCloseTo(at.x / Math.hypot(at.x, at.y));
		expect(hit.hitDir.y).toBeCloseTo(at.y / Math.hypot(at.x, at.y));
		expect(Math.hypot(hit.hitDir.x, hit.hitDir.y)).toBeCloseTo(1);
	});

	test("без точки удара направление не ломает нормализацию", () => {
		for (const mark of [{ hitAt: 1 }, { hitAt: 1, hitFrom: at }]) {
			const hit = shieldHit(mark, at, 1);
			expect(Math.hypot(hit.hitDir.x, hit.hitDir.y)).toBeCloseTo(1);
		}
	});
});
