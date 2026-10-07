import { HP_REGEN_AMOUNT, HP_REGEN_INTERVAL } from "../config.js";
import type { SystemFactory } from "./types.js";

export const createRegenSystem: SystemFactory = (ctx) => {
	const entities = ctx.world.with("hp").without("dead");

	return (dt) => {
		for (const entity of entities) {
			const hp = entity.hp;
			if (hp.regenIn === undefined) continue;

			hp.regenIn -= dt;
			if (hp.regenIn > 0) continue;

			hp.current = Math.min(hp.max, hp.current + HP_REGEN_AMOUNT);
			hp.regenIn = hp.current < hp.max ? HP_REGEN_INTERVAL : undefined;
		}
	};
};
