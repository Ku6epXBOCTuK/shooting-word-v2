import { expect, test, vi } from "vitest";
import type { Application } from "pixi.js";
import { createGameCore, type GameCoreRender } from "./core.js";
import type { GameAssets } from "./assets.js";
import { ViewerStore } from "#lib/features/persistence/viewer-store.js";

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
	batteries?: number;
}

function createRenderedGame() {
	const saved: SavedViewer[][] = [];
	const viewerStore = new ViewerStore({
		load: () => Promise.resolve(null),
		save: (_key, viewers) => {
			saved.push(viewers as SavedViewer[]);
			return Promise.resolve();
		},
	});
	const now = 1_000_000;
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

	return { game, saved };
}

test("chat message persists viewer via the shared context (rendered path)", () => {
	const { game, saved } = createRenderedGame();

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.step(0.1);

	expect(saved).toEqual([
		[expect.objectContaining({ userId: "u1", user: "alice" })],
	]);

	game.dispose();
});

test("reward battery grant persists viewer via the shared context (rendered path)", () => {
	const { game, saved } = createRenderedGame();

	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.step(0.1); // initial persist clears the dirty flag
	saved.length = 0;

	game.grantBatteries(["u1"]);
	game.step(0.1);

	expect(saved).toHaveLength(1);
	expect(saved[0]?.[0]?.batteries).toBe(1);

	game.dispose();
});
