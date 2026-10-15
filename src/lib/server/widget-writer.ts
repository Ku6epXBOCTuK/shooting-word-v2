import type { Cookies } from "@sveltejs/kit";
import { logger } from "#lib/logger.js";
import { broadcasters, type Broadcaster } from "./broadcasters/index.js";
import { sessionBroadcaster } from "./resolve-broadcaster.js";

export const WIDGET_KEY_HEADER = "x-widget-key";

// NOTE: a write needs the cabinet session or the uuid paired with its widget
// key (header only, a query param would leak into access logs).
export function requireWidgetWriter(
	cookies: Cookies,
	url: URL,
	request: Request,
): Broadcaster | Response {
	const bySession = sessionBroadcaster(cookies);
	if (bySession) return bySession;

	const uuid = url.searchParams.get("uuid");
	if (!uuid) return Response.json(null, { status: 404 });

	const key = request.headers.get(WIDGET_KEY_HEADER);
	if (!key) {
		logger.warn(`[widget] keyless request rejected: uuid=${uuid}`);
		return Response.json(null, { status: 403 });
	}

	const claim = broadcasters.claimWidget(uuid, key);
	if (claim === null) return Response.json(null, { status: 404 });
	if (claim === "duplicate") {
		logger.warn(`[widget] write with foreign key rejected: uuid=${uuid}`);
		return Response.json(null, { status: 403 });
	}

	return broadcasters.byUuid(uuid) as Broadcaster;
}
