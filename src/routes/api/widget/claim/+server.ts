import { broadcasters } from "#lib/server/broadcasters/index.js";
import { logger } from "#lib/logger.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch (error) {
		logger.warn(
			`[widget/claim] bad json body: ${error instanceof Error ? error.message : String(error)}`,
		);
		return Response.json({ error: "bad json" }, { status: 400 });
	}

	const uuid =
		typeof body === "object" && body !== null && "uuid" in body
			? (body as { uuid: unknown }).uuid
			: undefined;
	const key =
		typeof body === "object" && body !== null && "key" in body
			? (body as { key: unknown }).key
			: undefined;
	if (
		typeof uuid !== "string" ||
		uuid === "" ||
		typeof key !== "string" ||
		key === ""
	) {
		return Response.json({ error: "uuid and key required" }, { status: 400 });
	}

	const result = broadcasters.claimWidget(uuid, key);
	if (result === null) {
		return Response.json({ error: "unknown widget" }, { status: 404 });
	}

	if (result === "duplicate") {
		logger.warn(`[widget] duplicate claim rejected: uuid=${uuid}`);
	}

	return Response.json({ status: result });
};
