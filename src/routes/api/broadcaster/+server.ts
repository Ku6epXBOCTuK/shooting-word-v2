import { broadcasters } from "#lib/server/broadcasters/index.js";
import {
	resolveBroadcaster,
	sessionBroadcaster,
} from "#lib/server/resolve-broadcaster.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ url, cookies }) => {
	const broadcaster = resolveBroadcaster(cookies, url);

	if (!broadcaster) {
		return Response.json({ login: null }, { status: 404 });
	}

	const ownSession = sessionBroadcaster(cookies) !== null;

	return Response.json({
		login: broadcaster.login,
		...(ownSession ? { widgetUuid: broadcaster.widgetUuid } : {}),
	});
};

export const POST: RequestHandler = ({ cookies }) => {
	const broadcaster = sessionBroadcaster(cookies);

	if (!broadcaster) {
		return Response.json({ ok: false }, { status: 401 });
	}

	const widgetUuid = broadcasters.rotateUuid(broadcaster.userId);

	return Response.json({ ok: true, widgetUuid });
};
