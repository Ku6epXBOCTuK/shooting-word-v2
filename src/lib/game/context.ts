import type { World } from "miniplex";
import type { Application } from "pixi.js";
import type { ViewerStore } from "#lib/features/persistence/index.js";
import type { GameAssets } from "./assets.js";
import type { GameSettings } from "./settings.js";
import type { Entity, Size } from "./types.js";

export interface GameContext {
	world: World<Entity>;
	screen: Size;
	settings: GameSettings;
	viewerStore: ViewerStore;
	viewersDirty: boolean;
	now(): number;
	rng(): number;
}

export interface RenderContext extends GameContext {
	app: Application;
	assets: GameAssets;
}
