import type { Application } from "pixi.js";
import type { World } from "miniplex";
import type { Entity } from "./types.js";

export interface GameContext {
	world: World<Entity>;
	app: Application;
}
