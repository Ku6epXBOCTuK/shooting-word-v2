import { dev } from "$app/env";
import { normalizeSettings } from "#lib/game/settings.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { storage } from "#lib/server/storage/index.js";
import { viewers } from "#lib/server/viewers/index.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

interface StoredViewer {
	userId: string;
	[key: string]: unknown;
}

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

	return Response.json(null, { status: 400 });
};

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
		const body = (await request.json()) as StoredViewer[];
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
		const body = (await request.json()) as unknown;
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
