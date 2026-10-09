import { dev } from "$app/env";
import { VIEWER_TIMEOUT_MS } from "#lib/game/config.js";
import { normalizeSettings } from "#lib/game/settings.js";
import { logger } from "#lib/logger.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { storage } from "#lib/server/storage/index.js";
import { viewers } from "#lib/server/viewers/index.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

interface StoredViewer {
	userId: string;
	lastSeen?: number;
	[key: string]: unknown;
}

function purgeStale(
	broadcasterId: string,
	stored: StoredViewer[],
): StoredViewer[] {
	const now = Date.now();
	const fresh = stored.filter(
		(viewer) =>
			typeof viewer.lastSeen !== "number" ||
			now - viewer.lastSeen < VIEWER_TIMEOUT_MS,
	);

	if (fresh.length !== stored.length) {
		viewers.save(
			broadcasterId,
			fresh.map((viewer) => ({ userId: viewer.userId, data: viewer })),
		);
		logger.info(
			`[viewers] purged ${stored.length - fresh.length} stale: ${stored
				.filter((viewer) => !fresh.includes(viewer))
				.map((viewer) => viewer.userId)
				.join(", ")}`,
		);
	}

	return fresh;
}

export const GET: RequestHandler = ({ params, url, cookies }) => {
	const broadcaster = resolveBroadcaster(cookies, url);
	if (!broadcaster) {
		return Response.json(null, { status: 404 });
	}

	if (params.key === "viewers") {
		return Response.json(
			purgeStale(
				broadcaster.userId,
				viewers.load<StoredViewer>(broadcaster.userId),
			),
		);
	}

	if (params.key === "settings") {
		return Response.json(storage.load(broadcaster.userId, "settings"));
	}

	return Response.json(null, { status: 400 });
};

async function readJson(request: Request): Promise<unknown | null> {
	try {
		return await request.json();
	} catch (error) {
		logger.warn(
			`[storage] bad json body: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}
}

export const PUT: RequestHandler = async ({
	params,
	url,
	cookies,
	request,
}) => {
	const broadcaster = resolveBroadcaster(cookies, url);
	if (!broadcaster) {
		return Response.json(null, { status: 404 });
	}

	if (params.key === "viewers") {
		const body = (await readJson(request)) as StoredViewer[] | null;
		if (!Array.isArray(body)) {
			return Response.json(null, { status: 400 });
		}

		viewers.save(
			broadcaster.userId,
			body
				.filter((viewer) => typeof viewer.userId === "string")
				.map((viewer) => ({ userId: viewer.userId, data: viewer })),
		);

		return Response.json({ ok: true });
	}

	if (params.key === "settings") {
		const body = await readJson(request);
		if (typeof body !== "object" || body === null || Array.isArray(body)) {
			return Response.json(null, { status: 400 });
		}

		storage.save(
			broadcaster.userId,
			"settings",
			normalizeSettings(body, undefined, dev),
		);

		return Response.json({ ok: true });
	}

	return Response.json(null, { status: 400 });
};
