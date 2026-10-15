import { SHIELD_REGEN_INTERVAL } from "../config.js";
import { logger } from "#lib/logger.js";
import { addReaction } from "../reaction.js";
import type { SystemFactory } from "./types.js";

export const createEnemyShotHitSystem: SystemFactory = (ctx) => {
	const hits = ctx.world.with("enemyShot", "homing", "arrived", "position");

	return () => {
		for (const entity of hits) {
			const target = entity.homing.target;

			addReaction(
				ctx,
				entity.position,
				entity.enemyShot.damage > 0 ? "ship-hit" : "ship-ricochet",
			);

			if (entity.enemyShot.damage === 0) {
				ctx.world.addComponent(entity, "expired", true);
				continue;
			}

			if (ctx.world.has(target)) {
				if (target.shield && target.shield.hp > 0) {
					target.shield.hp = Math.max(
						0,
						target.shield.hp - entity.enemyShot.damage,
					);
					target.shield.regenIn ??= SHIELD_REGEN_INTERVAL;
					target.shield.hitAt = ctx.now();
					target.shield.hitFrom = { ...entity.position };
					logger.debug(
						`[shield] hit: ${target.viewer?.user ?? "?"} hp=${target.shield.hp}`,
					);
				} else if (target.hp) {
					target.hp.current = Math.max(
						0,
						target.hp.current - entity.enemyShot.damage,
					);

					if (target.hp.current <= 0 && !target.dead) {
						ctx.world.addComponent(target, "dead", true);
						if (target.position) {
							addReaction(ctx, target.position, "viewer-destroyed");
						}
						logger.debug(`[game] died: ${target.viewer?.user ?? "?"}`);
					}
				}
			}

			ctx.world.addComponent(entity, "expired", true);
		}
	};
};
