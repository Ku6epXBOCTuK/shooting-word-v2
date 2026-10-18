import { error, type RequestEvent } from "@sveltejs/kit";
import { logger } from "#lib/logger.js";
import { broadcasters, type Broadcaster } from "./broadcasters/index.js";
import { sessionBroadcaster } from "./resolve-broadcaster.js";

export const WIDGET_KEY_HEADER = "x-widget-key";

// NOTE: a write needs the cabinet session or the uuid paired with its widget
// key (header only, a query param would leak into access logs).
export function requireWidgetWriter(
	event: Pick<RequestEvent, "cookies" | "url" | "request">,
): Broadcaster {
	return authorizeWidgetWriter(
		event.cookies,
		event.url.searchParams.get("uuid"),
		event.request.headers.get(WIDGET_KEY_HEADER),
	);
}

// NOTE: remote commands cannot read the request url, so the uuid and the key
// arrive as arguments (POST body, never a query param).
export function authorizeWidgetWriter(
	cookies: RequestEvent["cookies"],
	uuid: string | null,
	key: string | null,
): Broadcaster {
	const session = sessionBroadcaster(cookies);
	if (session) return session;

	if (!uuid) throw error(404, "unknown widget");
	if (!key) {
		logger.warn(`[widget] keyless request rejected: uuid=${uuid}`);
		throw error(403, "widget key required");
	}

	const claimed = broadcasters.claimWidget(uuid, key);
	if (!claimed) throw error(404, "unknown widget");
	if (claimed.claim === "duplicate") {
		logger.warn(`[widget] write with foreign key rejected: uuid=${uuid}`);
		throw error(403, "widget key rejected");
	}

	return claimed.broadcaster;
}
