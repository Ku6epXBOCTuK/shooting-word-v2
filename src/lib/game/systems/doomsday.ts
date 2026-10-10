import {
	BULLET_HIT_DISTANCE,
	DOOMSDAY_BOLT_INTERVAL,
	DOOMSDAY_BOLT_SPEED,
	DOOMSDAY_INTRO_SPARK_DURATION,
	DOOMSDAY_SPARK_INTERVAL,
	DOOMSDAY_SPARK_INTERVAL_INTRO,
} from "../config.js";
import { bumpRoundStat } from "../round-stats.js";
import type { SystemFactory } from "./types.js";

const SPARK_TTL_MIN = 0.6;
const SPARK_TTL_SPREAD = 0.8;
const SPARK_SPEED_INTRO_MIN = 400;
const SPARK_SPEED_INTRO_SPREAD = 600;
const SPARK_SPEED_MIN = 200;
const SPARK_SPEED_SPREAD = 500;
const SPARK_RADIUS_INTRO = 4;

export const createDoomsdaySystem: SystemFactory = (ctx) => {
	const devices = ctx.world.with("doomsday", "position");
	const bolts = ctx.world.with("doomsdayBolt", "homing", "arrived");
	const targets = ctx.world
		.with("word", "position", "doomsdayed")
		.without("expired");
	const flagged = ctx.world.with("doomsdayed");
	const sessions = ctx.world.with("session", "roundStats");

	return (dt) => {
		for (const bolt of bolts) {
			const target = bolt.homing.target;
			if (bolt.doomsdayBolt.intro) {
				for (const device of devices) {
					device.doomsday.active = true;
				}
			} else if (ctx.world.has(target) && !target.expired && target.position) {
				ctx.world.add({
					position: { x: target.position.x, y: target.position.y },
					explosion: { age: 0 },
				});
				ctx.world.addComponent(target, "expired", true);
				for (const session of sessions) {
					for (const device of devices) {
						bumpRoundStat(
							session.roundStats,
							"doomsday",
							device.doomsday.shooterId,
							device.doomsday.user,
						);
					}
				}
			}
			ctx.world.addComponent(bolt, "expired", true);
		}

		for (const device of devices) {
			const state = device.doomsday;
			if (!state.active) continue;

			state.elapsed += dt;
			if (state.elapsed >= state.duration) {
				for (const entity of flagged) {
					ctx.world.removeComponent(entity, "doomsdayed");
				}
				ctx.world.remove(device);
				continue;
			}

			state.sparkTimer -= dt;
			if (state.sparkTimer <= 0) {
				const intro = state.elapsed < DOOMSDAY_INTRO_SPARK_DURATION;
				state.sparkTimer = intro
					? DOOMSDAY_SPARK_INTERVAL_INTRO
					: DOOMSDAY_SPARK_INTERVAL;
				const angle = ctx.rng() * Math.PI * 2;
				const speed = intro
					? SPARK_SPEED_INTRO_MIN + ctx.rng() * SPARK_SPEED_INTRO_SPREAD
					: SPARK_SPEED_MIN + ctx.rng() * SPARK_SPEED_SPREAD;
				ctx.world.add({
					position: { x: device.position.x, y: device.position.y },
					spark: {
						vx: Math.cos(angle) * speed,
						vy: Math.sin(angle) * speed,
						age: 0,
						ttl: SPARK_TTL_MIN + ctx.rng() * SPARK_TTL_SPREAD,
						...(intro ? { radius: SPARK_RADIUS_INTRO } : {}),
					},
				});
			}

			state.boltTimer -= dt;
			if (state.boltTimer <= 0) {
				state.boltTimer = DOOMSDAY_BOLT_INTERVAL;
				const candidates = [...targets];
				if (candidates.length === 0) continue;
				const target = candidates[Math.floor(ctx.rng() * candidates.length)];
				ctx.world.add({
					doomsdayBolt: { intro: false },
					homing: {
						target,
						speed: DOOMSDAY_BOLT_SPEED,
						hitDistance: BULLET_HIT_DISTANCE,
					},
					position: { x: device.position.x, y: device.position.y },
				});
			}
		}
	};
};
