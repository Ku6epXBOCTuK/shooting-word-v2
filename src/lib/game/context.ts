import type { Application } from "pixi.js";
import type { World } from "miniplex";
import type { ChatMessage } from "#lib/chat/port.js";
import type { Entity } from "./types.js";

export interface GameContext {
	world: World<Entity>;
	app: Application;
	spawnQueue: ChatMessage[];
}
