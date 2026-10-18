import { error } from "@sveltejs/kit";
import { query } from "$app/server";
import * as v from "valibot";
import { broadcasters } from "#lib/server/broadcasters/index.js";
import {
	ensureRewardEffects,
	getRewardEffects,
	subscribeEffects,
} from "#lib/server/reward-effects.js";
import { SERVER_VERSION } from "#lib/server/version.js";

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
