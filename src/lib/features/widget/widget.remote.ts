import { error } from "@sveltejs/kit";
import { command, getRequestEvent, query } from "$app/server";
import { dev } from "$app/env";
import * as v from "valibot";
import {
	isStoredViewer,
	type StoredViewer,
} from "#lib/features/persistence/viewer-store.js";
import { isRoundRecord } from "#lib/features/rounds/record.js";
import { normalizeSettings } from "#lib/game/settings.js";
import { logger } from "#lib/logger.js";
import { broadcasters } from "#lib/server/broadcasters/index.js";
import {
	ensureRewardEffects,
	getRewardEffects,
	refundRedemption,
	subscribeEffects,
} from "#lib/server/reward-effects.js";
import { sessionBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { rounds } from "#lib/server/rounds/index.js";
import { settings } from "#lib/server/settings/index.js";
import { SERVER_VERSION } from "#lib/server/version.js";
import { viewers, type ViewerProfile } from "#lib/server/viewers/index.js";
import { authorizeWidgetWriter } from "#lib/server/widget-writer.js";

const widgetRef = {
	uuid: v.string(),
	key: v.optional(v.string()),
};

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
	...widgetRef,
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

// NOTE: viewers travel through commands, not through a query: query arguments
// are serialized into the request url and the widget key would land in access logs.
export const viewersLoad = command(v.object(widgetRef), ({ uuid, key }) => {
	const broadcaster = authorizeWidgetWriter(
		getRequestEvent().cookies,
		uuid,
		key ?? null,
	);

	return viewers.load<StoredViewer>(broadcaster.userId);
});

const viewersSaveArgs = v.object({
	...widgetRef,
	viewers: v.array(v.unknown()),
});

export const viewersSave = command(viewersSaveArgs, (args) => {
	const broadcaster = authorizeWidgetWriter(
		getRequestEvent().cookies,
		args.uuid,
		args.key ?? null,
	);

	const now = Date.now();
	const profiles: ViewerProfile[] = [];
	for (const entry of args.viewers) {
		if (!isStoredViewer(entry)) continue;
		profiles.push({
			userId: entry.userId,
			data: entry,
			updatedAt: entry.updatedAt ?? now,
		});
	}

	viewers.upsert(broadcaster.userId, profiles);
});

export const settingsLoad = command(v.object(widgetRef), ({ uuid, key }) => {
	const broadcaster = authorizeWidgetWriter(
		getRequestEvent().cookies,
		uuid,
		key ?? null,
	);

	return normalizeSettings(settings.load(broadcaster.userId), undefined, dev);
});

const roundArgs = v.object({
	...widgetRef,
	record: v.unknown(),
});

export const reportRound = command(roundArgs, (args) => {
	const broadcaster = authorizeWidgetWriter(
		getRequestEvent().cookies,
		args.uuid,
		args.key ?? null,
	);

	if (!isRoundRecord(args.record)) {
		logger.warn("[rounds] rejected malformed round record");
		error(400, "malformed round record");
	}

	rounds.add(broadcaster.userId, args.record);
});

export const widgetLogin = command(
	v.object({ uuid: v.string() }),
	({ uuid }) => {
		const broadcaster =
			sessionBroadcaster(getRequestEvent().cookies) ??
			(uuid ? broadcasters.byUuid(uuid) : null);

		return broadcaster ? { login: broadcaster.login } : null;
	},
);
