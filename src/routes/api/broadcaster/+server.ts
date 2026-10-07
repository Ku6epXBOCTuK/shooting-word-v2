import { broadcasters } from "#lib/server/broadcasters/index.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ url }) => {
	const uuid = url.searchParams.get("uuid");
	const broadcaster = uuid ? broadcasters.byUuid(uuid) : null;

	if (!broadcaster) {
		return Response.json({ login: null }, { status: 404 });
	}

	return Response.json({ login: broadcaster.login });
};
