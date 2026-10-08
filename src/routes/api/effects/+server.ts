import { broadcasters } from "#lib/server/broadcasters/index.js";
import {
	ensureRewardEffects,
	getRewardEffects,
} from "#lib/server/reward-effects.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ url }) => {
	const uuid = url.searchParams.get("uuid");
	const broadcaster = uuid ? broadcasters.byUuid(uuid) : null;

	if (!broadcaster) {
		return Response.json({ shields: [], effects: [] }, { status: 404 });
	}

	ensureRewardEffects(broadcaster);
	return Response.json(getRewardEffects(broadcaster.userId));
};
