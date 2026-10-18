import { error } from "@sveltejs/kit";
import { command, getRequestEvent, query } from "$app/server";
import * as v from "valibot";
import { logger } from "#lib/logger.js";
import { broadcasters } from "#lib/server/broadcasters/index.js";
import {
	ensureRewardEffects,
	getRewardEffects,
	refundRedemption,
	subscribeEffects,
} from "#lib/server/reward-effects.js";
import { SERVER_VERSION } from "#lib/server/version.js";
import { authorizeWidgetWriter } from "#lib/server/widget-writer.js";

const streamArgs = v.object({ uuid: v.string() });

export const effectsStream = query.live(streamArgs, async function* ({ uuid }) {
	const broadcaster = broadcasters.byUuid(uuid);
	if (!broadcaster) error(404, "unknown widget");

	ensureRewardEffects(broadcaster);

	let dirty = false;
	let notify: (() => void) | null = null;

	const unsubscribe = subscribeEffects(broadcaster.userId, () => {
		dirty = true;
		notify?.();
	});

	const snapshot = () => ({
		...getRewardEffects(broadcaster.userId),
		version: SERVER_VERSION,
	});

	try {
		yield snapshot();
		while (true) {
			while (!dirty) {
				await new Promise<void>((resolve) => {
					notify = resolve;
				});
			}
			notify = null;
			dirty = false;
			yield snapshot();
		}
	} finally {
		unsubscribe();
	}
});

const rejectArgs = v.object({
	uuid: v.string(),
	key: v.optional(v.string()),
	redemptionId: v.string(),
	rewardId: v.string(),
	reason: v.string(),
});

export const rejectEffect = command(rejectArgs, async (args) => {
	const broadcaster = authorizeWidgetWriter(
		getRequestEvent().cookies,
		args.uuid,
		args.key ?? null,
	);

	const refunded = await refundRedemption(
		broadcaster,
		args.rewardId,
		args.redemptionId,
		args.reason,
	);
	logger.info(
		`[effects] widget rejected redemption ${args.redemptionId}: ${args.reason} (${broadcaster.login})`,
	);

	return { refunded };
});
