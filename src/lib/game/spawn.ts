import type { World } from "miniplex";
import type { ChatMessage } from "#lib/chat/port.js";
import {
	FOCAL,
	LAND_OFFSET_X,
	LAND_OFFSET_Y,
	MAX_FLY_SPEED,
	MIN_FLY_SPEED,
	Z_FAR,
} from "./config.js";
import type { Entity } from "./types.js";

export function spawnWord(
	world: World<Entity>,
	message: ChatMessage,
	screen: { width: number; height: number },
) {
	const landX = (Math.random() * 2 - 1) * screen.width * LAND_OFFSET_X;
	const landY = (Math.random() * 2 - 1) * screen.height * LAND_OFFSET_Y;
	const speed = MIN_FLY_SPEED + Math.random() * (MAX_FLY_SPEED - MIN_FLY_SPEED);

	world.add({
		position: { x: screen.width / 2, y: screen.height / 2 },
		position3: { x: landX, y: landY, z: Z_FAR },
		velocity3: { x: 0, y: 0, z: -speed },
		scale: FOCAL / Z_FAR,
		word: { text: message.text, userId: message.userId, user: message.user },
	});
}
