import type { bootstrapGame } from "#lib/game/index.js";
import type { ChatMessage, ChatPort } from "./port.js";
import { TwurpleChatAdapter } from "./twurple-adapter.js";

type Game = Awaited<ReturnType<typeof bootstrapGame>>;

export function handleChatMessage(
	game: Game | null,
	message: ChatMessage,
): void {
	game?.joinViewer({ userId: message.userId, user: message.user });

	const text = message.text.trim();
	if (text === "!игра") {
		game?.startGame();
		return;
	}
	if (text === "!боты") {
		for (let i = 0; i < 5; i++) {
			const id = Math.random().toString(36).slice(2, 8);
			game?.joinViewer({ userId: `bot-${id}`, user: `бот-${id}` });
		}
		return;
	}
	if (text.startsWith("!скин")) {
		const argument = text.slice("!скин".length).trim();
		const skin = Number.parseInt(argument, 10);
		game?.changeSkin(message.userId, Number.isNaN(skin) ? undefined : skin);
		return;
	}
	if (text === "!rep" || text === "!рем") {
		game?.repair(message.userId);
		return;
	}
	if (text.startsWith("!repair")) {
		const target = text.slice("!repair".length).trim().replace(/^@/, "");
		game?.repair(message.userId, target || undefined);
		return;
	}

	game?.shoot(message);
}

export function startChatFlow(
	getGame: () => Game | null,
	channel: string,
	adapter: ChatPort = new TwurpleChatAdapter(),
): () => void {
	adapter.onMessage((message) => handleChatMessage(getGame(), message));
	adapter.connect(channel);
	return () => adapter.disconnect();
}
