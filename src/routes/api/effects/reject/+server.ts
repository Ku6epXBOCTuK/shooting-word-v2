import { logger } from "#lib/logger.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { refundRedemption } from "#lib/server/reward-effects.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

interface RejectBody {
	redemptionId?: unknown;
	rewardId?: unknown;
	reason?: unknown;
}

export const POST: RequestHandler = async ({ cookies, url, request }) => {
	const broadcaster = resolveBroadcaster(cookies, url);
	if (!broadcaster) {
		return Response.json(null, { status: 404 });
	}

	let body: RejectBody;
	try {
		body = (await request.json()) as RejectBody;
	} catch {
		return Response.json(null, { status: 400 });
	}

	if (
		typeof body.redemptionId !== "string" ||
		typeof body.rewardId !== "string"
	) {
		return Response.json(null, { status: 400 });
	}

	const reason =
		typeof body.reason === "string" ? body.reason : "rejected by widget";
	const refunded = await refundRedemption(
		broadcaster,
		body.rewardId,
		body.redemptionId,
		reason,
	);
	logger.info(
		`[effects] widget rejected redemption ${body.redemptionId}: ${reason} (${broadcaster.login})`,
	);

	return Response.json({ ok: true, refunded });
};
