import { describe, expect, it } from "vitest";
import { REWARD_CONFIGS } from "./config.js";
import {
	defaultRewards,
	effectiveRewards,
	effectiveTitle,
	normalizeRewards,
	REWARDS_SCHEMA,
	stripDevTitle,
} from "./settings.js";

const findConfig = (key: string) => {
	const config = REWARD_CONFIGS.find((item) => item.key === key);
	if (!config) throw new Error(`no reward config for ${key}`);
	return config;
};

describe("defaultRewards", () => {
	it("заполняет все ключи значениями из REWARD_CONFIGS", () => {
		const rewards = defaultRewards();
		for (const config of REWARD_CONFIGS) {
			const entry = rewards[config.key as keyof typeof rewards];
			expect(entry).toBeDefined();
			expect(entry?.title).toBe(config.title);
			expect(entry?.description).toBe(config.description);
			expect(entry?.cost).toBe(config.cost);
			expect(entry?.cooldown).toBe(config.cooldown);
		}
	});
});

describe("normalizeRewards", () => {
	it("читает оверрайды по ключу награды", () => {
		const rewards = normalizeRewards({ shield: { cost: 500 } });
		expect(rewards.shield?.cost).toBe(500);
	});

	it("сохраняет только переданные поля (дельты)", () => {
		const rewards = normalizeRewards({ shield: { cost: 500 } });
		expect(rewards.shield).toEqual({ cost: 500 });
		expect(rewards.shield?.title).toBeUndefined();
	});

	it("клампит числа в границы схемы", () => {
		const rewards = normalizeRewards({
			shield: { cost: 99_999_999 },
			battery: { cost: 0 },
		});
		expect(rewards.shield?.cost).toBe(1_000_000);
		expect(rewards.battery?.cost).toBe(1);
	});

	it("отбрасывает невалидные типы и пустые строки", () => {
		const rewards = normalizeRewards({
			shield: { cost: "500" as unknown as number, title: "" },
		});
		expect(rewards.shield?.cost).toBeUndefined();
		expect(rewards.shield?.title).toBeUndefined();
	});

	it("выбрасывает неизвестное поле внутри известного ключа", () => {
		const rewards = normalizeRewards({
			shield: { cost: 500, hacker: 1 } as unknown as Record<string, number>,
		});
		expect(rewards.shield).toEqual({ cost: 500 });
	});

	it("обрезает строки по maxLength", () => {
		const title = "я".repeat(60);
		const rewards = normalizeRewards({ shield: { title } });
		expect(rewards.shield?.title?.length).toBe(45);
	});

	it("игнорирует неизвестные ключи наград", () => {
		const rewards = normalizeRewards({ hacker: { cost: 1 } });
		expect("hacker" in rewards).toBe(false);
	});

	it("не пишет пустой оверрайд, если валидных полей нет", () => {
		const rewards = normalizeRewards({
			shield: { cost: "x" as unknown as number },
		});
		expect(rewards.shield).toBeUndefined();
	});

	it("возвращает пустой объект для не-объектов", () => {
		expect(normalizeRewards(null)).toEqual({});
		expect(normalizeRewards("junk")).toEqual({});
		expect(normalizeRewards(42)).toEqual({});
	});

	it("мержит оверрайды нескольких наград", () => {
		const rewards = normalizeRewards({
			shield: { cost: 500 },
			doomsday: { cooldown: 120 },
		});
		expect(rewards.shield?.cost).toBe(500);
		expect(rewards.doomsday?.cooldown).toBe(120);
	});
});

describe("effectiveRewards", () => {
	it("без оверрайдов отдаёт значения из REWARD_CONFIGS", () => {
		for (const config of REWARD_CONFIGS) {
			const effective = effectiveRewards({}).find(
				(item) => item.key === config.key,
			);
			expect(effective).toBeDefined();
			expect(stripDevTitle(effective!.title)).toBe(config.title);
			expect(effective!.cost).toBe(config.cost);
			expect(effective!.description).toBe(config.description);
			expect(effective!.cooldown).toBe(config.cooldown);
		}
	});

	it("мерж поле-в-поле: оверрайд перекрывает только своё поле", () => {
		const shield = findConfig("shield");
		const effective = effectiveRewards({ shield: { cost: 777 } }).find(
			(item) => item.key === "shield",
		);
		expect(effective).toBeDefined();
		expect(effective!.cost).toBe(777);
		// прочие поля остаются дефолтными
		expect(stripDevTitle(effective!.title)).toBe(shield.title);
		expect(effective!.description).toBe(shield.description);
		expect(effective!.cooldown).toBe(shield.cooldown);
	});

	it("перекрывает title и cooldown одновременно, cost остаётся дефолтным", () => {
		const shield = findConfig("shield");
		const effective = effectiveRewards({
			shield: { title: "Щит капитана", cooldown: 60 },
		}).find((item) => item.key === "shield");
		expect(stripDevTitle(effective!.title)).toBe("Щит капитана");
		expect(effective!.cooldown).toBe(60);
		expect(effective!.cost).toBe(shield.cost);
	});

	it("награда без оверрайда не затронута оверрайдами других", () => {
		const battery = findConfig("battery");
		const effective = effectiveRewards({ shield: { cost: 999 } }).find(
			(item) => item.key === "battery",
		);
		expect(effective!.cost).toBe(battery.cost);
	});
});

describe("effectiveTitle / stripDevTitle", () => {
	it("effectiveTitle обратим к stripDevTitle", () => {
		expect(stripDevTitle(effectiveTitle("Щит"))).toBe("Щит");
	});

	it("stripDevTitle снимает ровно один dev-префикс", () => {
		expect(stripDevTitle("Dev: Щит")).toBe("Щит");
		expect(stripDevTitle("Щит")).toBe("Щит");
	});

	it("stripDevTitle не трогает середину строки", () => {
		expect(stripDevTitle("Мой Dev: щит")).toBe("Мой Dev: щит");
	});
});

describe("REWARDS_SCHEMA", () => {
	it("содержит ровно настраиваемые поля награды", () => {
		expect(REWARDS_SCHEMA.map((def) => def.key).sort()).toEqual(
			["cooldown", "cost", "description", "title"].sort(),
		);
	});
});
