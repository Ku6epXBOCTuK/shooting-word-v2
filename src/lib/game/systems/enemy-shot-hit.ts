import {
	ENEMY_SHOT_SPEED,
	RICOCHET_SPEED_FACTOR,
	RICOCHET_TTL,
	SHIELD_REGEN_INTERVAL,
	SPARK_COUNT,
	SPARK_HIT_COUNT,
	SPARK_HIT_TTL,
	SPARK_SPEED,
	SPARK_TTL,
} from "../config.js";
import { logger } from "#lib/logger.js";
import type { SystemFactory } from "./types.js";

export const createEnemyShotHitSystem: SystemFactory = (ctx) => {
	const hits = ctx.world.with("enemyShot", "homing", "arrived", "position");

	return () => {
		for (const entity of hits) {
			const target = entity.homing.target;

			const isHit = entity.enemyShot.damage > 0;
			const sparkCount = isHit ? SPARK_HIT_COUNT : SPARK_COUNT;
			const sparkTtl = isHit ? SPARK_HIT_TTL : SPARK_TTL;
			for (let i = 0; i < sparkCount; i++) {
				const angle = Math.random() * Math.PI * 2;
				const speed = SPARK_SPEED * (0.5 + Math.random() * 0.5);
				ctx.world.add({
					position: { x: entity.position.x, y: entity.position.y },
					spark: {
						vx: Math.cos(angle) * speed,
						vy: Math.sin(angle) * speed,
						age: 0,
						ttl: sparkTtl,
					},
				});
			}

			if (entity.enemyShot.damage === 0) {
				const angle = -Math.PI / 4 - Math.random() * (Math.PI / 2);
				const speed = ENEMY_SHOT_SPEED * RICOCHET_SPEED_FACTOR;
				ctx.world.add({
					position: { x: entity.position.x, y: entity.position.y },
					ricochet: {
						vx: Math.cos(angle) * speed,
						vy: Math.sin(angle) * speed,
						age: 0,
						ttl: RICOCHET_TTL,
					},
				});
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
							ctx.world.add({
								position: {
									x: target.position.x,
									y: target.position.y,
								},
								explosion: { age: 0 },
							});
						}
						logger.debug(`[game] died: ${target.viewer?.user ?? "?"}`);
					}
				}
			}

			ctx.world.addComponent(entity, "expired", true);
		}
	};
};
