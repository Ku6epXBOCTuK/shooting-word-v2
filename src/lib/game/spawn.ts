import type { World } from "miniplex";
import {
	FOCAL,
	FONT_SIZE,
	MAX_FLY_SPEED,
	MIN_FLY_SPEED,
	VIEWER_BASE_HP,
	VIEWER_SCALE,
	VIEWER_WIDTH,
	WALK_MAX_SPEED,
	WALK_MAX_TURN_TIME,
	WALK_MIN_SPEED,
	Z_FAR,
} from "./config.js";
import type { Entity, Size, Viewer, Word } from "./types.js";

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

export function spawnViewer(
	world: World<Entity>,
	viewer: Viewer,
	screen: Size,
	xp = 0,
	batteries = 0,
) {
	const width = VIEWER_WIDTH * VIEWER_SCALE;
	const halfWidth = width / 2;
	const x = halfWidth + Math.random() * Math.max(1, screen.width - width);

	world.add({
		viewer,
		xp,
		batteries,
		hp: { current: VIEWER_BASE_HP, max: VIEWER_BASE_HP },
		position: { x, y: 0 },
		walker: {
			direction: Math.random() < 0.5 ? -1 : 1,
			speed: WALK_MIN_SPEED + Math.random() * (WALK_MAX_SPEED - WALK_MIN_SPEED),
			timer: Math.random() * WALK_MAX_TURN_TIME,
		},
	});
}
