import type { World } from "miniplex";
import type { Application } from "pixi.js";
import type { RoundRecord } from "#lib/features/rounds/record.js";
import type { StoredViewer } from "#lib/features/persistence/viewer-store.js";
import type { ViewerStore } from "#lib/features/persistence/index.js";
import type { VfxLayer } from "#lib/vfx/layer.js";
import type { GameAssets } from "./assets.js";
import type { GameSettings } from "./settings.js";
import type { Entity, Size } from "./types.js";

export interface GameContext {
	world: World<Entity>;
	screen: Size;
	settings: GameSettings;
	viewerStore: ViewerStore;
	viewersDirty: boolean;
	// NOTE: viewer profiles live outside the world: a timeout removes the entity
	// from screen, but xp, skin and ammo stay here and reach persistence.
	viewerProfiles: Map<string, StoredViewer>;
	onRoundEnd?: (record: RoundRecord) => void;
	now(): number;
	rng(): number;
	measureText(text: string, fontSize: number): Size;
}

export interface RenderContext extends GameContext {
	app: Application;
	assets: GameAssets;
	vfx: VfxLayer;
}
