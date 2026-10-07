import { ApiClient } from "@twurple/api";
import { RefreshingAuthProvider } from "@twurple/auth";
import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } from "$app/env/private";
import { logger } from "#lib/logger.js";
import type { Broadcaster } from "./broadcasters/index.js";
import { broadcasters } from "./broadcasters/index.js";

export const TWITCH_SCOPES = ["channel:manage:redemptions", "user:write:chat"];

const globalScope = globalThis as typeof globalThis & {
	__authProvider?: RefreshingAuthProvider | null;
	__authRegisteredUsers?: Set<string>;
};

const registeredUsers = (globalScope.__authRegisteredUsers ??= new Set());

export function isConfigured(): boolean {
	return Boolean(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET);
}

function getProvider(): RefreshingAuthProvider {
	if (!globalScope.__authProvider) {
		globalScope.__authProvider = new RefreshingAuthProvider({
			clientId: TWITCH_CLIENT_ID ?? "",
			clientSecret: TWITCH_CLIENT_SECRET ?? "",
		});
		globalScope.__authProvider.onRefresh((userId, token) => {
			try {
				broadcasters.updateToken(userId, token);
			} catch {
				logger.error(`[auth] failed to store refreshed token for ${userId}`);
			}
		});
	}
	return globalScope.__authProvider;
}

export async function getApiClient(
	broadcaster: Broadcaster,
): Promise<ApiClient | null> {
	if (!isConfigured()) return null;

	const authProvider = getProvider();
	if (!registeredUsers.has(broadcaster.userId)) {
		await authProvider.addUserForToken(broadcaster.token, []);
		registeredUsers.add(broadcaster.userId);
	}

	return new ApiClient({ authProvider });
}
