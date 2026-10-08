import { broadcasters } from "#lib/server/broadcasters/index.js";
import {
	ensureBatteryFeature,
	takeBatteryGrants,
} from "#lib/server/batteries.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ url }) => {
	const uuid = url.searchParams.get("uuid");
	const broadcaster = uuid ? broadcasters.byUuid(uuid) : null;

	if (!broadcaster) {
		return Response.json({ grants: [] }, { status: 404 });
	}

	ensureBatteryFeature(broadcaster);
	return Response.json({ grants: takeBatteryGrants(broadcaster.userId) });
};
