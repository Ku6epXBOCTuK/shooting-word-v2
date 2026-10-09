import type { GameContext, RenderContext } from "../context.js";

export type System = ((dt: number) => void) & { dispose?: () => void };
export type SystemFactory = (ctx: GameContext) => System;
export type SystemGroup = { name: string; factories: SystemFactory[] };
export type RenderSystemFactory = (ctx: RenderContext) => System;
export type RenderSystemGroup = {
	name: string;
	factories: RenderSystemFactory[];
};
