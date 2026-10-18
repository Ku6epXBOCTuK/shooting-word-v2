import { describe, expect, it } from "vitest";
import { REWARD_CONFIGS } from "./config.js";
import {
	defaultRewardValues,
	effectiveTitle,
	normalizeValues,
	REWARDS_SCHEMA,
} from "./settings.js";

const valid = {
	title: "Щит",
	description: "описание",
	cost: 300,
	cooldown: 0,
};

describe("defaultRewardValues", () => {
	it("берёт значения из конфига для каждой награды", () => {
		for (const config of REWARD_CONFIGS) {
			const values = defaultRewardValues(config.key);
			expect(values.title).toBe(effectiveTitle(config.title));
			expect(values.description).toBe(config.description);
			expect(values.cost).toBe(config.cost);
			expect(values.cooldown).toBe(config.cooldown);
		}
	});

	it("падает на неизвестном ключе", () => {
		expect(() => defaultRewardValues("hacker")).toThrow();
	});
});

describe("normalizeValues", () => {
	it("пропускает валидные значения", () => {
		expect(normalizeValues(valid)).toEqual(valid);
	});

	it("разрешает пустое описание", () => {
		expect(normalizeValues({ ...valid, description: "" })).toEqual({
			...valid,
			description: "",
		});
	});

	it("режет строки по длине из схемы", () => {
		expect(
			normalizeValues({ ...valid, title: "x".repeat(60) })?.title,
		).toHaveLength(45);
	});

	it("зажимает числа в границы схемы", () => {
		expect(normalizeValues({ ...valid, cost: 0 })?.cost).toBe(1);
		expect(normalizeValues({ ...valid, cooldown: 999_999 })?.cooldown).toBe(
			604_800,
		);
	});

	it("отклоняет мусор", () => {
		expect(normalizeValues(null)).toBeNull();
		expect(normalizeValues("junk")).toBeNull();
		expect(normalizeValues(42)).toBeNull();
		expect(normalizeValues({ ...valid, cost: "300" })).toBeNull();
		expect(normalizeValues({ title: "Щит" })).toBeNull();
		expect(normalizeValues({ ...valid, title: "" })).toBeNull();
	});
});

describe("REWARDS_SCHEMA", () => {
	it("описывает четыре поля награды", () => {
		expect(REWARDS_SCHEMA.map((def) => def.key).sort()).toEqual([
			"cooldown",
			"cost",
			"description",
			"title",
		]);
	});

	it("запрещает кулдаун и стоимость вне Twitch-лимитов", () => {
		const cost = REWARDS_SCHEMA.find((def) => def.key === "cost");
		const cooldown = REWARDS_SCHEMA.find((def) => def.key === "cooldown");
		expect(cost?.min).toBe(1);
		expect(cooldown?.min).toBe(0);
	});
});
