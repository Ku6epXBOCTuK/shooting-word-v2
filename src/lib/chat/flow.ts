import type { bootstrapGame } from "#lib/game/index.js";
import type { ChatMessage, ChatPort } from "./port.js";
import { TwurpleChatAdapter } from "./twurple-adapter.js";

type Game = Awaited<ReturnType<typeof bootstrapGame>>;

const BOT_LIMIT = 20;

interface Command {
	name: string;
	modOnly?: boolean;
	aliases?: string[];
	run: (game: Game, message: ChatMessage, argument: string) => void;
}

const COMMANDS: Command[] = [
	{
		name: "!игра",
		modOnly: true,
		run: (game) => game.startGame(),
	},
	{
		name: "!афк",
		modOnly: true,
		run: (game) => game.setAfk(true),
	},
	{
		name: "!афк-",
		modOnly: true,
		run: (game) => game.setAfk(false),
	},
	{
		name: "!боты-",
		modOnly: true,
		run: (game) => game.removeBots(),
	},
	{
		name: "!боты",
		modOnly: true,
		run: (game, _message, argument) => {
			const parsed = Number.parseInt(argument, 10);
			const count = Math.min(
				BOT_LIMIT,
				Number.isNaN(parsed) ? 5 : Math.max(1, parsed),
			);
			for (let i = 0; i < count; i++) {
				const id = Math.random().toString(36).slice(2, 8);
				game.joinViewer({ userId: `bot-${id}`, user: `бот-${id}`, bot: true });
			}
		},
	},
	{
		name: "!скин",
		run: (game, message, argument) => {
			const skin = Number.parseInt(argument, 10);
			game.changeSkin(message.userId, Number.isNaN(skin) ? undefined : skin);
		},
	},
	{
		name: "!rep",
		aliases: ["!рем"],
		run: (game, message) => game.repair(message.userId),
	},
	{
		name: "!repair",
		run: (game, message, argument) => {
			game.repair(message.userId, argument.replace(/^@/, "") || undefined);
		},
	},
];

function matchCommand(
	text: string,
): { command: Command; argument: string } | null {
	for (const command of COMMANDS) {
		const names = [command.name, ...(command.aliases ?? [])];
		for (const name of names) {
			if (text === name) return { command, argument: "" };
			if (text.startsWith(`${name} `) || text.startsWith(`${name}\t`)) {
				return { command, argument: text.slice(name.length).trim() };
			}
		}
	}
	return null;
}

export function handleChatMessage(
	game: Game | null,
	message: ChatMessage,
): void {
	game?.joinViewer({ userId: message.userId, user: message.user });

	const text = message.text.trim();
	const matched = matchCommand(text);

	if (!matched) {
		game?.shoot(message);
		return;
	}

	const { command, argument } = matched;
	if (command.modOnly && !message.isMod) return;
	if (game) command.run(game, message, argument);
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
