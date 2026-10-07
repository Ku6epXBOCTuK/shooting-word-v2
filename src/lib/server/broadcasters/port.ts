import type { AccessToken } from "@twurple/auth";

export interface Broadcaster {
	userId: string;
	login: string;
	widgetUuid: string;
	token: AccessToken;
}

export interface BroadcastersRepo {
	upsert(userId: string, login: string, token: AccessToken): Broadcaster;
	byUserId(userId: string): Broadcaster | null;
	byUuid(widgetUuid: string): Broadcaster | null;
	updateToken(userId: string, token: AccessToken): void;
}
