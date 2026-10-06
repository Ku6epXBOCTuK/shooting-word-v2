import { RefreshingAuthProvider, type AccessToken } from "@twurple/auth";
import { readFile, writeFile } from "node:fs/promises";
import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } from "$app/env/private";

const TOKEN_FILE = "twitch-token.json";

export const TWITCH_SCOPES = ["channel:manage:redemptions", "user:write:chat"];

interface StoredAuth {
	userId: string;
	token: AccessToken;
}

let provider: RefreshingAuthProvider | null = null;
let storedUserId: string | null = null;

export async function saveToken(
	userId: string,
	token: AccessToken,
): Promise<void> {
	storedUserId = userId;

	const stored: StoredAuth = { userId, token };
	await writeFile(TOKEN_FILE, JSON.stringify(stored, null, 2));
}

async function loadStored(): Promise<StoredAuth | null> {
	try {
		const raw = await readFile(TOKEN_FILE, "utf-8");
		return JSON.parse(raw) as StoredAuth;
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

	provider.onRefresh((userId, token) => {
		void saveToken(userId, token).catch(() => {});
	});

	const stored = await loadStored();
	if (stored) {
		storedUserId = stored.userId;
		await provider.addUserForToken(stored.token, []);
	}

	return provider;
}

export function getStoredUserId(): string | null {
	return storedUserId;
}

export function resetAuthProvider(): void {
	provider = null;
}

export async function clearStoredAuth(): Promise<void> {
	provider = null;
	storedUserId = null;

	const { unlink } = await import("node:fs/promises");
	await unlink(TOKEN_FILE).catch(() => {});
}

export function isConfigured(): boolean {
	return Boolean(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET);
}
