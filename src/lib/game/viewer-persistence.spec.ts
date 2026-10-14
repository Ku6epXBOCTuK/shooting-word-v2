import { expect, test, vi } from "vitest";
import type { Application } from "pixi.js";
import { createGameCore, type GameCoreRender } from "./core.js";
import type { GameAssets } from "./assets.js";
import { VIEWER_TIMEOUT_MS } from "./config.js";
import {
	ViewerStore,
	type StoredViewer,
} from "#lib/features/persistence/viewer-store.js";

// The bug this guards against only exists on the rendered path, where
// createGameCore used to spread ctx into a *new* object for the factory
// context. That split gave `viewersDirty` two independent bindings: the public
// API (joinViewer, grantBatteries, …) wrote the original, while the
// viewer-persistence system read the copy — so chat joins and reward grants
// never triggered a save (no PUT to the backend). Stub pixi.js so the render
// systems can run headlessly and the shared-context contract is exercised.
vi.mock("pixi.js", () => {
	class Graphics {
		visible = true;
		clear() {
			return this;
		}
		roundRect() {
			return this;
		}
		rect() {
			return this;
		}
		circle() {
			return this;
		}
		star() {
			return this;
		}
		lineStyle() {
			return this;
		}
		fill() {
			return this;
		}
		stroke() {
			return this;
		}
		destroy() {}
	}
	class Sprite {
		anchor = { set() {} };
		scale = { set() {} };
		visible = true;
		tint = 0;
		width = 10;
		height = 10;
		constructor() {}
		destroy() {}
	}
	class AnimatedSprite {
		anchor = { set() {} };
		scale = { set() {} };
		animationSpeed = 0;
		textures: unknown[] = [];
		visible = true;
		width = 10;
		height = 10;
		constructor(textures?: unknown[]) {
			this.textures = textures ?? [];
		}
		play() {}
		stop() {}
		destroy() {}
	}
	class Text {
		anchor = { set() {} };
		scale = { set() {} };
		visible = true;
		x = 0;
		y = 0;
		width = 40;
		height = 12;
		text = "";
		alpha = 1;
		tint = 0;
		constructor() {}
		destroy() {}
	}
	class TextStyle {
		constructor() {}
	}
	class Container {
		children: unknown[] = [];
		addChild(...kids: unknown[]) {
			this.children.push(...kids);
		}
		destroy() {}
	}
	return { Graphics, Sprite, AnimatedSprite, Text, TextStyle, Container };
});

interface SavedViewer {
	userId: string;
	user: string;
	skin?: number;
	xp?: number;
	batteries?: number;
	updatedAt?: number;
}

/** Прогоняет отложенные цепочки сохранения (load → capture → save). */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

interface GameOptions {
	/** Что вернёт первый load(): список профилей или управляемый промис. */
	load?: Promise<StoredViewer[]> | StoredViewer[];
}

function createRenderedGame(options: GameOptions = {}) {
	const saved: SavedViewer[][] = [];
	const loadResult: Promise<unknown> = Promise.resolve(options.load ?? null);
	const viewerStore = new ViewerStore({
		load: vi.fn(() => loadResult),
		save: (_key, viewers) => {
			saved.push(viewers as SavedViewer[]);
			return Promise.resolve();
		},
	});
	let now = 1_000_000;
	const assets = {
		explosion: [],
		bullet: {},
		ships: [[]],
	} as unknown as GameAssets;
	const render: GameCoreRender = {
		app: {
			stage: { addChild() {}, removeChild() {} },
			screen: { width: 800, height: 600 },
		} as unknown as Application,
		assets,
	};

	const game = createGameCore(
		{
			screen: { width: 800, height: 600 },
			viewerStore,
			now: () => now,
			rng: () => 0.5,
			measureText: () => ({ width: 10, height: 10 }),
		},
		render,
	);

	return { game, saved, setNow: (value: number) => (now = value) };
}

test("chat message persists viewer via the shared context (rendered path)", async () => {
	const { game, saved } = createRenderedGame();

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.step(0.1);
	await flush();

	expect(saved).toEqual([
		[expect.objectContaining({ userId: "u1", user: "alice" })],
	]);

	game.dispose();
});

test("reward battery grant persists viewer via the shared context (rendered path)", async () => {
	const { game, saved } = createRenderedGame();

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.step(0.1);
	await flush(); // initial persist clears the dirty flag
	saved.length = 0;

	game.grantBatteries(["u1"]);
	game.step(0.1);
	await flush();

	expect(saved).toHaveLength(1);
	expect(saved[0]?.[0]?.batteries).toBe(1);

	game.dispose();
});

// Регрессия на главную потерю данных: таймаут снимал сущность с экрана, и
// снапшот сохранялся уже без неё — запись зрителя стиралась из базы вместе
// с опытом, скином и расходниками. Теперь у сущности есть профиль вне мира.
test("timed-out viewer keeps their profile in the saved list", async () => {
	const { game, saved, setNow } = createRenderedGame();

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	const entity = [...game.world.with("viewer")][0];
	if (!entity) throw new Error("viewer missing");
	entity.xp = 7;
	entity.batteries = 2;
	game.step(0.1);
	await flush();
	saved.length = 0;

	setNow(1_000_000 + VIEWER_TIMEOUT_MS + 60_000);
	game.step(1.1); // таймаут проверяется раз в секунду
	await flush();

	expect([...game.world.with("viewer")]).toHaveLength(0);
	expect(saved.at(-1)).toEqual([
		expect.objectContaining({ userId: "u1", xp: 7, batteries: 2 }),
	]);

	game.dispose();
});

// Протухший зритель не занимает экран, но его профиль живёт: при первом
// сообщении в чат возвращаются скин, опыт и расходники.
test("stale viewer returns with skin and progress on rejoin", async () => {
	const stored: StoredViewer[] = [
		{
			userId: "u1",
			user: "alice",
			login: "alice",
			lastSeen: 1_000_000 - VIEWER_TIMEOUT_MS * 2,
			skin: 5,
			xp: 42,
			batteries: 3,
			revives: 1,
			beacons: 0,
		},
	];
	const { game } = createRenderedGame({ load: stored });
	await flush();

	expect([...game.world.with("viewer")]).toHaveLength(0);

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	const [viewer] = [...game.world.with("viewer")];
	expect(viewer.viewer.skin).toBe(5);
	expect(viewer.xp).toBe(42);
	expect(viewer.batteries).toBe(3);

	game.dispose();
});

// Гонка на старте: сообщение в чат приходит раньше ответа GET. Раньше такое
// сохранение писало неполный список и стирало остальных зрителей, а restore
// создавал дубль сущности.
test("chat message during the initial load neither duplicates nor wipes viewers", async () => {
	let release: (value: StoredViewer[]) => void = () => {};
	const load = new Promise<StoredViewer[]>((resolve) => {
		release = resolve;
	});
	const stored: StoredViewer[] = [
		{
			userId: "u1",
			user: "alice",
			login: "alice",
			lastSeen: 999_000,
			skin: 5,
			xp: 42,
			batteries: 3,
			revives: 0,
			beacons: 0,
		},
	];
	const { game, saved } = createRenderedGame({ load });

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.step(0.1);
	await flush();
	expect(saved).toHaveLength(0); // до чтения базы не сохраняем

	release(stored);
	await flush();
	game.step(0.1);
	await flush();

	expect([...game.world.with("viewer")]).toHaveLength(1);
	const [viewer] = [...game.world.with("viewer")];
	expect(viewer.xp).toBe(42);
	expect(viewer.viewer.skin).toBe(5);
	expect(saved.at(-1)).toEqual([
		expect.objectContaining({ userId: "u1", xp: 42, skin: 5 }),
	]);

	game.dispose();
});

// Сервер начисляет расходники в профиль и присылает абсолютные счётчики:
// виджет поднимает значение до серверного, но не считает `+1` заново и не
// откатывает потраченное в этой сессии.
test("server counts are synced without double counting", async () => {
	const { game, saved } = createRenderedGame();

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.step(0.1);
	await flush();
	saved.length = 0;

	game.applyConsumables([{ userId: "u1", batteries: 4 }]);
	game.step(0.1);
	await flush();
	expect(saved.at(-1)?.[0]?.batteries).toBe(4);

	// повторный синк того же значения ничего не меняет
	game.applyConsumables([{ userId: "u1", batteries: 4 }]);
	game.step(0.1);
	await flush();
	expect(saved.at(-1)?.[0]?.batteries).toBe(4);

	// более низкое значение не откатывает локальную трату
	game.applyConsumables([{ userId: "u1", batteries: 1 }]);
	game.step(0.1);
	await flush();
	expect(saved.at(-1)?.[0]?.batteries).toBe(4);

	game.dispose();
});
