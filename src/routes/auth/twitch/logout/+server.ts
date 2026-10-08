import { redirect } from "@sveltejs/kit";
import { broadcasters } from "#lib/server/broadcasters/index.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { SESSION_COOKIE, sessions } from "#lib/server/sessions/index.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ url, cookies }) => {
	const broadcaster = resolveBroadcaster(cookies, url);

	if (broadcaster) {
		sessions.removeForBroadcaster(broadcaster.userId);
		broadcasters.remove(broadcaster.userId);
	}

	cookies.delete(SESSION_COOKIE, { path: "/" });

	redirect(302, "/");
};
