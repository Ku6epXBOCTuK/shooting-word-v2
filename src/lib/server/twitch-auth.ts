import { RefreshingAuthProvider, type AccessToken } from "@twurple/auth";
import { readFile, writeFile } from "node:fs/promises";
import {
	TWITCH_BROADCASTER_ID,
	TWITCH_CLIENT_ID,
	TWITCH_CLIENT_SECRET,
} from "$app/env/private";

const TOKEN_FILE = "twitch-token.json";

export const TWITCH_SCOPES = ["channel:read:redemptions"];

let provider: RefreshingAuthProvider | null = null;

export async function saveToken(token: AccessToken): Promise<void> {
	await writeFile(TOKEN_FILE, JSON.stringify(token, null, 2));
}

async function loadInitialToken(): Promise<AccessToken | null> {
	try {
		const raw = await readFile(TOKEN_FILE, "utf-8");
		return JSON.parse(raw) as AccessToken;
	} catch {
		return null;
	}
}

export async function getAuthProvider(): Promise<RefreshingAuthProvider | null> {
	if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) return null;

	if (provider) return provider;

	provider = new RefreshingAuthProvider({
		clientId: TWITCH_CLIENT_ID,
		clientSecret: TWITCH_CLIENT_SECRET,
	});

	provider.onRefresh((_userId, token) => {
		void saveToken(token).catch(() => {});
	});

	const token = await loadInitialToken();
	if (token) {
		await provider.addUserForToken(token, []);
	}

	return provider;
}

export function resetAuthProvider(): void {
	provider = null;
}

export function isConfigured(): boolean {
	return Boolean(
		TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET && TWITCH_BROADCASTER_ID,
	);
}
