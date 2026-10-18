import type { StoredViewer } from "#lib/features/persistence/index.js";
import { logger } from "#lib/logger.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { requireWidgetWriter } from "#lib/server/widget-writer.js";
import { viewers, type ViewerProfile } from "#lib/server/viewers/index.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ url, cookies }) => {
	const broadcaster = resolveBroadcaster(cookies, url);
	if (!broadcaster) {
		return Response.json(null, { status: 404 });
	}

	return Response.json(viewers.load(broadcaster.userId));
};

async function readJson(request: Request): Promise<unknown | null> {
	try {
		return await request.json();
	} catch (error) {
		logger.warn(
			`[viewers] bad json body: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}
}

export const PUT: RequestHandler = async (event) => {
	const broadcaster = requireWidgetWriter(event);

	const body = await readJson(event.request);
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
			updatedAt: typeof viewer.updatedAt === "number" ? viewer.updatedAt : now,
		});
	}

	viewers.upsert(broadcaster.userId, profiles);

	return Response.json({ ok: true });
};
