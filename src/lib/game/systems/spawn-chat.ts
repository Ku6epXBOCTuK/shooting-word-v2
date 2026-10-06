import { collectTakenRects, findPlacement } from "../placement.js";
import { estimateWordSize, spawnEnemy } from "../spawn.js";
import type { SystemFactory } from "./types.js";

const SPAWN_COOLDOWN = 0.1;
const RETRY_COOLDOWN = 0.25;

export const createChatSpawnSystem: SystemFactory = (ctx) => {
	const enemies = ctx.world.with("word", "position");
	let cooldown = 0;

	return (dt) => {
		cooldown -= dt;
		if (cooldown > 0) return;

		const message = ctx.spawnQueue[0];
		if (!message) return;

		const screen = ctx.app.screen;
		const size = estimateWordSize(message.text);
		const offset = findPlacement(
			screen,
			size,
			collectTakenRects(enemies, screen),
		);

		if (!offset) {
			cooldown = RETRY_COOLDOWN;
			return;
		}

		spawnEnemy(
			ctx.world,
			{ text: message.text, userId: message.userId, user: message.user },
			screen,
			offset,
			size,
		);
		ctx.spawnQueue.shift();
		cooldown = SPAWN_COOLDOWN;
	};
};
