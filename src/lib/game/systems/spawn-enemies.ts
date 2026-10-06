import {
	ENEMY_BOTTOM_MARGIN,
	ENEMY_SPAWN_MAX_INTERVAL,
	ENEMY_SPAWN_MIN_INTERVAL,
	MAX_ENEMIES,
} from "../config.js";
import { collectTakenRects, findPlacement } from "../placement.js";
import { estimateWordSize, spawnEnemy } from "../spawn.js";
import { randomWord } from "../words.js";
import type { SystemFactory } from "./types.js";

export const createEnemySpawnSystem: SystemFactory = (ctx) => {
	const enemies = ctx.world.with("word", "position");
	let timer = ENEMY_SPAWN_MIN_INTERVAL;

	return (dt) => {
		timer -= dt;
		if (timer > 0) return;

		timer =
			ENEMY_SPAWN_MIN_INTERVAL +
			Math.random() * (ENEMY_SPAWN_MAX_INTERVAL - ENEMY_SPAWN_MIN_INTERVAL);

		if (enemies.size >= MAX_ENEMIES) return;

		const screen = ctx.app.screen;
		const text = randomWord();
		const size = estimateWordSize(text);
		const offset = findPlacement(
			screen,
			size,
			collectTakenRects(enemies, screen),
			ENEMY_BOTTOM_MARGIN,
		);

		if (!offset) return;

		spawnEnemy(
			ctx.world,
			{ text, userId: "enemy", user: "enemy" },
			screen,
			offset,
			size,
		);
	};
};
