export function twitchClientId(): string {
	return process.env.TWITCH_CLIENT_ID ?? "";
}

export function twitchClientSecret(): string {
	return process.env.TWITCH_CLIENT_SECRET ?? "";
}

export function twitchRedirectUri(fallback: string): string {
	return process.env.TWITCH_REDIRECT_URI ?? fallback;
}
