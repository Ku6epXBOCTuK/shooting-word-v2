import {
	ENEMY_BOTTOM_MARGIN,
	ENEMY_SPAWN_MAX_INTERVAL,
	ENEMY_SPAWN_MIN_INTERVAL,
	MAX_ENEMIES,
	pressureMaxEnemies,
	pressureSpawnInterval,
	SESSION_ENEMY_GRACE,
} from "../config.js";
import { collectTakenRects, findPlacement } from "../placement.js";
import { estimateWordSize, spawnEnemy } from "../spawn.js";
import { SESSIONPHASE } from "../types.js";
import { randomWord } from "../words.js";
import type { SystemFactory } from "./types.js";

export const createEnemySpawnSystem: SystemFactory = (ctx) => {
	const sessions = ctx.world.with("session");
	const enemies = ctx.world.with("word", "position");
	const aliveViewers = ctx.world.with("viewer").without("dead");
	let timer = ENEMY_SPAWN_MIN_INTERVAL;
	let peakAlive = 0;

	return (dt) => {
		let canSpawn = true;
		let pressure = false;
		for (const entity of sessions) {
			const { phase, timer: phaseTimer } = entity.session;
			pressure =
				phase === SESSIONPHASE.PLAYING && phaseTimer >= SESSION_ENEMY_GRACE;
			canSpawn = phase === SESSIONPHASE.IDLE || pressure;
		}
		if (!pressure) peakAlive = 0;
		if (!canSpawn) return;

		timer -= dt;
		if (timer > 0) return;

		let cap = MAX_ENEMIES;
		if (pressure) {
			peakAlive = Math.max(peakAlive, aliveViewers.size);
			const { min, max } = pressureSpawnInterval(
				peakAlive,
				ctx.settings.pressureSpawnK,
			);
			timer = min + ctx.rng() * (max - min);
			cap = pressureMaxEnemies(peakAlive);
		} else {
			timer =
				ENEMY_SPAWN_MIN_INTERVAL +
				ctx.rng() * (ENEMY_SPAWN_MAX_INTERVAL - ENEMY_SPAWN_MIN_INTERVAL);
		}

		if (enemies.size >= cap) return;

		const screen = ctx.screen;
		const taken = new Set<string>();
		for (const enemy of enemies) taken.add(enemy.word.text);
		const text = randomWord(ctx.rng, taken);
		const size = estimateWordSize(text);
		const offset = findPlacement(
			screen,
			size,
			collectTakenRects(enemies, screen),
			ENEMY_BOTTOM_MARGIN,
			ctx.rng,
		);

		if (!offset) return;

		spawnEnemy(
			ctx.world,
			{ text, userId: "enemy", user: "enemy" },
			screen,
			offset,
			size,
			ctx.rng,
		);
	};
};
