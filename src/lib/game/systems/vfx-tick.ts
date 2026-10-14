import type { RenderSystemFactory } from "./types.js";

/**
 * Единственное место, где двигается время слоя эффектов. Идёт последним в
 * группе рендера: остальные системы успевают записать состояние своих эффектов,
 * и они обновляются в том же кадре, без задержки.
 */
export const createVfxTickSystem: RenderSystemFactory =
	(ctx) => (dt: number) => {
		ctx.vfx.update(dt);
	};
