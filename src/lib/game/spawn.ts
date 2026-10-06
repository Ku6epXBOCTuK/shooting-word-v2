import type { World } from "miniplex";
import {
	FOCAL,
	FONT_SIZE,
	MAX_FLY_SPEED,
	MIN_FLY_SPEED,
	Z_FAR,
} from "./config.js";
import type { Entity, Size, Word } from "./types.js";

export function estimateWordSize(text: string): Size {
	return {
		width: Math.max(FONT_SIZE, text.length * FONT_SIZE * 0.55),
		height: FONT_SIZE * 1.3,
	};
}

export function spawnEnemy(
	world: World<Entity>,
	word: Word,
	screen: Size,
	offset: { x: number; y: number },
	size: Size,
) {
	const speed = MIN_FLY_SPEED + Math.random() * (MAX_FLY_SPEED - MIN_FLY_SPEED);

	world.add({
		position: { x: screen.width / 2, y: screen.height / 2 },
		position3: { x: offset.x, y: offset.y, z: Z_FAR },
		velocity3: { x: 0, y: 0, z: -speed },
		scale: FOCAL / Z_FAR,
		size,
		word,
	});
}
