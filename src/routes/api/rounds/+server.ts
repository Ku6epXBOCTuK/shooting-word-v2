import { isRoundRecord } from "#lib/features/rounds/record.js";
import { logger } from "#lib/logger.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { rounds } from "#lib/server/rounds/index.js";
import { requireWidgetWriter } from "#lib/server/widget-writer.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function readLimit(url: URL): number {
	const raw = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
	if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_LIMIT;
	return Math.min(raw, MAX_LIMIT);
}

export const GET: RequestHandler = ({ url, cookies }) => {
	const broadcaster = resolveBroadcaster(cookies, url);
	if (!broadcaster) {
		return Response.json(null, { status: 404 });
	}

	return Response.json(rounds.recent(broadcaster.userId, readLimit(url)));
};

export const POST: RequestHandler = async ({ url, cookies, request }) => {
	const access = requireWidgetWriter(cookies, url, request);
	if (access instanceof Response) return access;
	const broadcaster = access;

	let body: unknown;
	try {
		body = await request.json();
	} catch (error) {
		logger.warn(
			`[rounds] bad json body: ${error instanceof Error ? error.message : String(error)}`,
		);
		return Response.json(null, { status: 400 });
	}

	if (!isRoundRecord(body)) {
		logger.warn("[rounds] rejected malformed round record");
		return Response.json(null, { status: 400 });
	}

	rounds.add(broadcaster.userId, body);

	return Response.json({ ok: true });
};
