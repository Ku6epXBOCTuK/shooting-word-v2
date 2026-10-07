import { HP_REGEN_INTERVAL, SHIELD_REGEN_INTERVAL } from "../config.js";
import type { SystemFactory } from "./types.js";

export const createEnemyShotHitSystem: SystemFactory = (ctx) => {
	const hits = ctx.world.with("enemyShot", "homing", "arrived");

	return () => {
		for (const entity of hits) {
			const target = entity.homing.target;

			if (ctx.world.has(target)) {
				if (target.shield && target.shield.hp > 0) {
					target.shield.hp = Math.max(
						0,
						target.shield.hp - entity.enemyShot.damage,
					);
					target.shield.regenIn ??= SHIELD_REGEN_INTERVAL;
					console.log(
						`[shield] hit: ${target.viewer?.user ?? "?"} hp=${target.shield.hp}`,
					);
				} else if (target.hp) {
					target.hp.current = Math.max(
						0,
						target.hp.current - entity.enemyShot.damage,
					);
					target.hp.regenIn ??= HP_REGEN_INTERVAL;
				}
			}

			ctx.world.addComponent(entity, "expired", true);
		}
	};
};
