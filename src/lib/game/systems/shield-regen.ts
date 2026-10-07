import { SHIELD_MAX_HP, SHIELD_REGEN_INTERVAL } from "../config.js";
import type { SystemFactory } from "./types.js";

export const createShieldRegenSystem: SystemFactory = (ctx) => {
	const shielded = ctx.world.with("shield");

	return (dt) => {
		for (const entity of shielded) {
			const shield = entity.shield;
			if (shield.regenIn === undefined) continue;

			shield.regenIn -= dt;
			if (shield.regenIn > 0) continue;

			shield.hp = Math.min(SHIELD_MAX_HP, shield.hp + 1);
			console.log(
				`[shield] regen: ${entity.viewer?.user ?? "?"} hp=${shield.hp}`,
			);
			shield.regenIn =
				shield.hp < SHIELD_MAX_HP ? SHIELD_REGEN_INTERVAL : undefined;
		}
	};
};
