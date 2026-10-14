import {
	BULLET_HIT_DISTANCE,
	DOOMSDAY_BOLT_INTERVAL,
	DOOMSDAY_BOLT_SPEED,
	DOOMSDAY_INTRO_SPARK_DURATION,
	DOOMSDAY_SPARK_INTERVAL,
	DOOMSDAY_SPARK_INTERVAL_INTRO,
} from "../config.js";
import { addReaction } from "../reaction.js";
import { bumpRoundStat } from "../round-stats.js";
import type { SystemFactory } from "./types.js";

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
				addReaction(ctx, target.position, "word-destroyed");
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
				addReaction(
					ctx,
					device.position,
					"device-spark",
					intro ? ctx.rng() : 0,
				);
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
