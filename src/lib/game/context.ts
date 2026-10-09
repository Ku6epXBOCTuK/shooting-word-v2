import type { Application } from "pixi.js";
import type { World } from "miniplex";
import type { ViewerStore } from "#lib/features/persistence/index.js";
import type { GameAssets } from "./assets.js";
import type { GameSettings } from "./settings.js";
import type { Entity } from "./types.js";

export interface GameContext {
	world: World<Entity>;
	app: Application;
	assets: GameAssets;
	settings: GameSettings;
	viewerStore: ViewerStore;
	viewersDirty: boolean;
}
