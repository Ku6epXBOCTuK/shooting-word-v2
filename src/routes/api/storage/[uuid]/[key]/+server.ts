import { broadcasters } from "#lib/server/broadcasters/index.js";
import { viewers } from "#lib/server/viewers/index.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

interface StoredViewer {
	userId: string;
	[key: string]: unknown;
}

export const GET: RequestHandler = ({ params }) => {
	const broadcaster = broadcasters.byUuid(params.uuid);
	if (!broadcaster) {
		return Response.json(null, { status: 404 });
	}

	if (params.key !== "viewers") {
		return Response.json(null, { status: 400 });
	}

	return Response.json(viewers.load(broadcaster.userId));
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const broadcaster = broadcasters.byUuid(params.uuid);
	if (!broadcaster) {
		return Response.json(null, { status: 404 });
	}

	if (params.key !== "viewers") {
		return Response.json(null, { status: 400 });
	}

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
};
