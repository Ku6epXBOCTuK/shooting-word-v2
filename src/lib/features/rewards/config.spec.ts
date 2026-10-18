import { describe, expect, test } from "vitest";
import { AURA_KINDS, COATING_KINDS, REACTION_KINDS } from "#lib/vfx/kinds.js";
import { REWARD_CONFIGS, rewardVisual, type RewardVisual } from "./config.js";

const asArray = (values: readonly string[]) => values as string[];

describe("визуал наград", () => {
	test("у каждой награды есть визуал", () => {
		expect(
			REWARD_CONFIGS.filter((reward) => reward.visual === undefined).map(
				(reward) => reward.key,
			),
		).toEqual([]);
	});

	test("визуал ссылается только на существующие виды эффектов", () => {
		const known = new Set([
			...asArray(AURA_KINDS),
			...asArray(COATING_KINDS),
			...asArray(REACTION_KINDS),
		]);
		for (const reward of REWARD_CONFIGS) {
			const visual: RewardVisual = reward.visual;
			expect(known).toContain(visual.reaction);
			if (visual.kind === "aura") {
				expect(asArray(AURA_KINDS)).toContain(visual.aura);
			}
			if (visual.kind === "coating") {
				expect(asArray(COATING_KINDS)).toContain(visual.coating);
			}
		}
	});

	test("у каждого визуала есть цвет для вспышки", () => {
		for (const reward of REWARD_CONFIGS) {
			expect(reward.visual.color).toBeGreaterThan(0);
		}
	});

	test("по ключу находится визуал нужной награды", () => {
		expect(rewardVisual("shield")?.kind).toBe("aura");
		expect(rewardVisual("armorCoating")?.kind).toBe("coating");
		expect(rewardVisual("battery")?.kind).toBe("reaction");
		expect(rewardVisual("nope")).toBeUndefined();
	});
});
