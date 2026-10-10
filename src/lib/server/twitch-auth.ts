import { ApiClient } from "@twurple/api";
import { RefreshingAuthProvider } from "@twurple/auth";
import { logger } from "#lib/logger.js";
import type { Broadcaster } from "./broadcasters/index.js";
import { broadcasters } from "./broadcasters/index.js";
import { twitchClientId, twitchClientSecret } from "./twitch-env.js";

export const TWITCH_SCOPES = ["channel:manage:redemptions", "user:write:chat"];

const globalScope = globalThis as typeof globalThis & {
	__authProvider?: RefreshingAuthProvider | null;
	__authRegisteredUsers?: Set<string>;
};

const registeredUsers = (globalScope.__authRegisteredUsers ??= new Set());

export function isConfigured(): boolean {
	return Boolean(twitchClientId() && twitchClientSecret());
}

function getProvider(): RefreshingAuthProvider {
	if (!globalScope.__authProvider) {
		globalScope.__authProvider = new RefreshingAuthProvider({
			clientId: twitchClientId(),
			clientSecret: twitchClientSecret(),
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
