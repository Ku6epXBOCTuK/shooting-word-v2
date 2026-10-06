import { ChatClient } from "@twurple/chat";
import type { ChatMessageHandler, ChatPort } from "./port.js";

export class TwurpleChatAdapter implements ChatPort {
	private client: ChatClient | null = null;
	private handlers: ChatMessageHandler[] = [];

	connect(channel: string): void {
		this.client = new ChatClient({ channels: [channel] });
		this.client.onMessage((chan, user, text, msg) => {
			const message = {
				channel: chan,
				userId: msg.userInfo.userId,
				user,
				text,
			};
			for (const handler of this.handlers) {
				handler(message);
			}
		});
		this.client.connect();
	}

	disconnect(): void {
		this.client?.quit();
		this.client = null;
	}

	onMessage(handler: ChatMessageHandler): void {
		this.handlers.push(handler);
	}
}
