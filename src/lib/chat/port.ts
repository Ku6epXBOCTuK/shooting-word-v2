export interface ChatMessage {
	channel: string;
	userId: string;
	user: string;
	login: string;
	text: string;
	isMod: boolean;
}

export type ChatMessageHandler = (message: ChatMessage) => void;

export interface ChatPort {
	connect(channel: string): void;
	disconnect(): void;
	onMessage(handler: ChatMessageHandler): void;
}
