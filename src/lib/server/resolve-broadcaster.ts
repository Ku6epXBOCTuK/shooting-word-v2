import type { Cookies } from "@sveltejs/kit";
import { broadcasters, type Broadcaster } from "./broadcasters/index.js";
import { SESSION_COOKIE, sessions } from "./sessions/index.js";

export function sessionBroadcaster(cookies: Cookies): Broadcaster | null {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;

	const userId = sessions.resolve(token);
	return userId ? broadcasters.byUserId(userId) : null;
}

export function resolveBroadcaster(
	cookies: Cookies,
	url: URL,
): Broadcaster | null {
	const bySession = sessionBroadcaster(cookies);
	if (bySession) return bySession;

	const uuid = url.searchParams.get("uuid");
	return uuid ? broadcasters.byUuid(uuid) : null;
}
