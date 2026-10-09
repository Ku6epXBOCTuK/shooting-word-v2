import type { World } from "miniplex";
import {
	FOCAL,
	FONT_SIZE,
	MAX_FLY_SPEED,
	MIN_FLY_SPEED,
	VIEWER_WIDTH,
	WALK_MAX_SPEED,
	WALK_MAX_TURN_TIME,
	WALK_MIN_SPEED,
	Z_FAR,
} from "./config.js";
import type { GameContext } from "./context.js";
import type { Entity, Size, Viewer, Word } from "./types.js";

export function estimateWordSize(text: string, fontSize = FONT_SIZE): Size {
	return {
		width: Math.max(fontSize, text.length * fontSize * 0.55),
		height: fontSize * 1.3,
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
	ctx: GameContext,
	viewer: Viewer,
	xp = 0,
	batteries = 0,
	revives = 0,
) {
	const { world, screen, settings } = ctx;
	const width = VIEWER_WIDTH * settings.viewerScale;
	const halfWidth = width / 2;
	const x = halfWidth + Math.random() * Math.max(1, screen.width - width);

	const baseHp = settings.viewerBaseHp;

	world.add({
		viewer,
		xp,
		batteries,
		revives,
		...(viewer.bot ? { bot: true } : {}),
		hp: { current: baseHp, max: baseHp },
		position: { x, y: 0 },
		walker: {
			direction: Math.random() < 0.5 ? -1 : 1,
			speed: WALK_MIN_SPEED + Math.random() * (WALK_MAX_SPEED - WALK_MIN_SPEED),
			timer: Math.random() * WALK_MAX_TURN_TIME,
		},
	});
}
