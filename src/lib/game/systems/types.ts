import type { GameContext } from "../context.js";

export type System = ((dt: number) => void) & { dispose?: () => void };
export type SystemFactory = (ctx: GameContext) => System;
export type SystemGroup = { name: string; factories: SystemFactory[] };
