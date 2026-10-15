import type { RenderSystemFactory } from "./types.js";

// NOTE: must stay last in the render group: earlier systems have written their
// effect state, so a reaction lands on screen in the same frame, not one later.
export const createVfxTickSystem: RenderSystemFactory =
	(ctx) => (dt: number) => {
		ctx.vfx.update(dt);
	};
