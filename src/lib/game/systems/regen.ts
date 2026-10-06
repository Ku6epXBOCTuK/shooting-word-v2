import { HP_REGEN_AMOUNT, HP_REGEN_INTERVAL } from "../config.js";
import type { SystemFactory } from "./types.js";

export const createRegenSystem: SystemFactory = (ctx) => {
	const entities = ctx.world.with("hp");
	let timer = HP_REGEN_INTERVAL;

	return (dt) => {
		timer -= dt;
		if (timer > 0) return;
		timer = HP_REGEN_INTERVAL;

		for (const entity of entities) {
			entity.hp.current = Math.min(
				entity.hp.max,
				entity.hp.current + HP_REGEN_AMOUNT,
			);
		}
	};
};
