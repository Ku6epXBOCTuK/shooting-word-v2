import { browser, dev } from "$app/env";

export const FULL_HOST = "https://xboct-games.duckdns.org";
export const TWITCH_LOGIN_URL = `${FULL_HOST}/auth/twitch/login`;

export const STATIC_HOST = "https://ku6epxboctuk.is-a.dev/shooting-word-v2";

export function gameHost(): string {
	if (!dev) return STATIC_HOST;
	return browser ? window.location.origin : "";
}
