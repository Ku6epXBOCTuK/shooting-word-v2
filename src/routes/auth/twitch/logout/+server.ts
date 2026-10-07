import { redirect } from "@sveltejs/kit";
import { broadcasters } from "#lib/server/broadcasters/index.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ url }) => {
	const uuid = url.searchParams.get("uuid");
	const broadcaster = uuid ? broadcasters.byUuid(uuid) : null;

	if (broadcaster) {
		broadcasters.remove(broadcaster.userId);
	}

	redirect(302, "/");
};
