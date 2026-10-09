import { describe, expect, it } from "vitest";
import {
	defaultSettings,
	normalizeSettings,
	parseSettings,
	serializeSettings,
	SETTINGS_SCHEMA,
} from "./settings.js";

describe("defaultSettings", () => {
	it("заполняет дефолты из схемы", () => {
		const settings = defaultSettings();
		for (const def of SETTINGS_SCHEMA) {
			expect(settings[def.key]).toBe(def.default);
		}
	});
});

describe("parseSettings", () => {
	it("читает значение из url-параметра", () => {
		const settings = parseSettings(new URLSearchParams("viewer_scale=3.5"));
		expect(settings.viewerScale).toBe(3.5);
	});

	it("клампит значение в границы схемы", () => {
		expect(
			parseSettings(new URLSearchParams("viewer_scale=99")).viewerScale,
		).toBe(6);
		expect(
			parseSettings(new URLSearchParams("viewer_scale=0")).viewerScale,
		).toBe(0.5);
	});

	it("игнорирует невалидное значение", () => {
		const settings = parseSettings(new URLSearchParams("viewer_scale=abc"));
		expect(settings.viewerScale).toBe(defaultSettings().viewerScale);
	});

	it("игнорирует неизвестные параметры", () => {
		const settings = parseSettings(new URLSearchParams("hacker=1"));
		expect("hacker" in settings).toBe(false);
	});

	it("мержит поверх base", () => {
		const base = { ...defaultSettings(), viewerScale: 4 };
		const settings = parseSettings(new URLSearchParams(""), base);
		expect(settings.viewerScale).toBe(4);
	});
});

describe("serializeSettings", () => {
	it("пишет только отличные от дефолта значения", () => {
		const params = serializeSettings(defaultSettings());
		expect([...params.entries()]).toEqual([]);
	});

	it("сериализует изменённое значение под именем url-параметра", () => {
		const settings = { ...defaultSettings(), viewerScale: 3 };
		expect(serializeSettings(settings).get("viewer_scale")).toBe("3");
	});

	it("фильтрует по scope", () => {
		const settings = { ...defaultSettings(), viewerScale: 3 };
		expect([...serializeSettings(settings, "full").entries()]).toEqual([]);
		expect(serializeSettings(settings, "static").get("viewer_scale")).toBe("3");
	});
});

describe("normalizeSettings", () => {
	it("читает значения по ключам схемы", () => {
		expect(normalizeSettings({ viewerScale: 3 }).viewerScale).toBe(3);
	});

	it("клампит числа и отбрасывает невалидные типы", () => {
		expect(normalizeSettings({ viewerScale: 99 }).viewerScale).toBe(6);
		expect(normalizeSettings({ viewerScale: "3" }).viewerScale).toBe(
			defaultSettings().viewerScale,
		);
	});

	it("игнорирует неизвестные ключи и не-объекты", () => {
		expect("hacker" in normalizeSettings({ hacker: 1 })).toBe(false);
		expect(normalizeSettings(null)).toEqual(defaultSettings());
		expect(normalizeSettings("junk")).toEqual(defaultSettings());
	});
});

describe("dev-параметры", () => {
	it("без includeDev отбрасываются из url", () => {
		const settings = parseSettings(new URLSearchParams("viewer_base_hp=10"));
		expect(settings.viewerBaseHp).toBe(defaultSettings().viewerBaseHp);
	});

	it("с includeDev читаются из url и клампятся", () => {
		expect(
			parseSettings(new URLSearchParams("viewer_base_hp=10"), undefined, true)
				.viewerBaseHp,
		).toBe(10);
		expect(
			parseSettings(new URLSearchParams("viewer_base_hp=99"), undefined, true)
				.viewerBaseHp,
		).toBe(20);
	});

	it("без includeDev отбрасываются из сохранённых настроек", () => {
		expect(normalizeSettings({ viewerBaseHp: 10 }).viewerBaseHp).toBe(
			defaultSettings().viewerBaseHp,
		);
		expect(
			normalizeSettings({ viewerBaseHp: 10 }, undefined, true).viewerBaseHp,
		).toBe(10);
	});

	it("не сериализуются в ссылку", () => {
		const settings = {
			...defaultSettings(),
			viewerBaseHp: 10,
			viewerScale: 3,
		};
		const params = serializeSettings(settings);
		expect(params.get("viewer_base_hp")).toBe(null);
		expect(params.get("viewer_scale")).toBe("3");
	});
});
