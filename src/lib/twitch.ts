import { ChatClient, type ChatMessage } from "@twurple/chat";

export type ChatMessageHandler = (
	channel: string,
	user: string,
	text: string,
	msg: ChatMessage,
) => void;

export function connectChat(channel: string, onMessage: ChatMessageHandler) {
	const chat = new ChatClient({ channels: [channel] });
	chat.onMessage(onMessage);
	chat.connect();
	return () => {
		chat.quit();
	};
}
