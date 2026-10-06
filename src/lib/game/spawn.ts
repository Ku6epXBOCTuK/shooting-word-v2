import type { World } from "miniplex";
import type { ChatMessage } from "#lib/chat/port.js";
import type { Entity } from "./types.js";

export function spawnWord(
	world: World<Entity>,
	message: ChatMessage,
	screen: { width: number; height: number },
) {
	const y = 40 + Math.random() * Math.max(1, screen.height - 80);

	world.add({
		position: { x: -100, y },
		velocity: { x: 60 + Math.random() * 80, y: 0 },
		word: { text: message.text, userId: message.userId, user: message.user },
	});
}
