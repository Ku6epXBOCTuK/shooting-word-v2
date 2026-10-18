import type { AccessToken } from "@twurple/auth";

export interface Broadcaster {
	userId: string;
	login: string;
	displayName: string | null;
	widgetUuid: string;
	token: AccessToken;
}

export type WidgetClaim = "first" | "owner" | "duplicate";

export interface WidgetClaimResult {
	claim: WidgetClaim;
	broadcaster: Broadcaster;
}

export interface BroadcastersRepo {
	upsert(
		userId: string,
		login: string,
		displayName: string | null,
		token: AccessToken,
	): Broadcaster;
	byUserId(userId: string): Broadcaster | null;
	byUuid(widgetUuid: string): Broadcaster | null;
	updateToken(userId: string, token: AccessToken): void;
	claimWidget(widgetUuid: string, key: string): WidgetClaimResult | null;
	rotateUuid(userId: string): string;
	remove(userId: string): void;
}
