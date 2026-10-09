export { bootstrapGame } from "./bootstrap.js";
export { createGameCore, type GameCore } from "./core.js";
export { createHeadlessGame, type HeadlessGameOptions } from "./headless.js";
export type { GameContext } from "./context.js";
export type {
	Entity,
	Lifetime,
	Position,
	Position3,
	Size,
	Velocity3,
	Word,
} from "./types.js";
export type { System, SystemFactory, SystemGroup } from "./systems/types.js";
