import { dev } from "$app/env";
import { normalizeSettings } from "#lib/game/settings.js";
import { logger } from "#lib/logger.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { settings } from "#lib/server/settings/index.js";
import { requireWidgetWriter } from "#lib/server/widget-writer.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ url, cookies }) => {
	const broadcaster = resolveBroadcaster(cookies, url);
	if (!broadcaster) {
		return Response.json(null, { status: 404 });
	}

	return Response.json(settings.load(broadcaster.userId));
};

async function readJson(request: Request): Promise<unknown | null> {
	try {
		return await request.json();
	} catch (error) {
		logger.warn(
			`[settings] bad json body: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}
}

export const PUT: RequestHandler = async ({ url, cookies, request }) => {
	const access = requireWidgetWriter(cookies, url, request);
	if (access instanceof Response) return access;
	const broadcaster = access;

	const body = await readJson(request);
	if (typeof body !== "object" || body === null || Array.isArray(body)) {
		return Response.json(null, { status: 400 });
	}

	settings.save(broadcaster.userId, normalizeSettings(body, undefined, dev));

	return Response.json({ ok: true });
};
