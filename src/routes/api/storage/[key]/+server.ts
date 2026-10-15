import { dev } from "$app/env";
import type { StoredViewer } from "#lib/features/persistence/index.js";
import { normalizeRewards } from "#lib/features/rewards/settings.js";
import { normalizeSettings } from "#lib/game/settings.js";
import { logger } from "#lib/logger.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { storage } from "#lib/server/storage/index.js";
import { viewers, type ViewerProfile } from "#lib/server/viewers/index.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ params, url, cookies }) => {
	const broadcaster = resolveBroadcaster(cookies, url);
	if (!broadcaster) {
		return Response.json(null, { status: 404 });
	}

	if (params.key === "viewers") {
		return Response.json(viewers.load(broadcaster.userId));
	}

	if (params.key === "settings") {
		return Response.json(storage.load(broadcaster.userId, "settings"));
	}

	if (params.key === "rewards") {
		return Response.json(storage.load(broadcaster.userId, "rewards"));
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
		const body = await readJson(request);
		if (!Array.isArray(body)) {
			return Response.json(null, { status: 400 });
		}

		const now = Date.now();
		const profiles: ViewerProfile[] = [];
		for (const entry of body) {
			if (typeof entry !== "object" || entry === null) continue;
			const viewer = entry as Partial<StoredViewer>;
			if (typeof viewer.userId !== "string") continue;
			profiles.push({
				userId: viewer.userId,
				data: viewer,
				updatedAt:
					typeof viewer.updatedAt === "number" ? viewer.updatedAt : now,
			});
		}

		viewers.upsert(broadcaster.userId, profiles);

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

	if (params.key === "rewards") {
		const body = await readJson(request);
		if (typeof body !== "object" || body === null || Array.isArray(body)) {
			return Response.json(null, { status: 400 });
		}

		storage.save(broadcaster.userId, "rewards", normalizeRewards(body));

		return Response.json({ ok: true });
	}

	return Response.json(null, { status: 400 });
};
