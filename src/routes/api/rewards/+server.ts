import type { Cookies } from "@sveltejs/kit";
import type { ApiClient, HelixCustomReward } from "@twurple/api";
import { dev } from "$app/env";
import { rewardIds } from "#lib/server/reward-ids/index.js";
import { planRewardPrune } from "#lib/server/reward-ids/prune.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { storage } from "#lib/server/storage/index.js";
import { getApiClient } from "#lib/server/twitch-auth.js";
import type { RequestHandler } from "./$types";
import type {
	AppRewardStatus,
	ChannelReward,
	RewardsManageResult,
} from "#lib/features/rewards/port.js";
import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
import { normalizeSettings, type GameSettings } from "#lib/game/settings.js";
import { logger } from "#lib/logger.js";

export const prerender = false;

async function resolveContext(cookies: Cookies, url: URL) {
	const broadcaster = resolveBroadcaster(cookies, url);
	if (!broadcaster) return null;

	const api = await getApiClient(broadcaster);
	if (!api) return null;

	const settings = normalizeSettings(
		storage.load(broadcaster.userId, "settings"),
	);

	return { api, userId: broadcaster.userId, settings };
}

function matchReward(
	existing: HelixCustomReward[],
	userId: string,
	key: string,
	title: string,
): HelixCustomReward | undefined {
	const storedId = rewardIds.get(userId, key);
	return (
		(storedId ? existing.find((item) => item.id === storedId) : undefined) ??
		existing.find((item) => item.title === title)
	);
}

const NOT_AUTHORIZED = {
	available: false,
	reason: "not authorized, visit /auth/twitch/login",
	rewards: [],
};

async function pruneOrphanRewards(context: {
	api: ApiClient;
	userId: string;
}): Promise<Set<string>> {
	const manageable = await context.api.channelPoints.getCustomRewards(
		context.userId,
		true,
	);
	const plan = planRewardPrune(
		rewardIds.list(context.userId),
		new Set(REWARD_CONFIGS.map((config) => config.key)),
		manageable.map((reward) => reward.id),
	);
	const removed = new Set<string>();

	for (const id of plan.deleteIds) {
		try {
			await context.api.channelPoints.deleteCustomReward(context.userId, id);
			removed.add(id);
		} catch (error) {
			logger.warn(
				`[rewards] failed to delete orphan reward ${id}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	for (const key of plan.staleKeys) {
		rewardIds.remove(context.userId, key);
	}

	if (removed.size > 0 || plan.staleKeys.length > 0) {
		logger.info(
			`[rewards] pruned ${removed.size} orphan rewards, ${plan.staleKeys.length} stale ids`,
		);
	}

	return removed;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const context = await resolveContext(cookies, url);

	if (!context) {
		return Response.json(NOT_AUTHORIZED, { status: 503 });
	}

	try {
		const all = await context.api.channelPoints.getCustomRewards(
			context.userId,
		);
		const removed = await pruneOrphanRewards(context);
		const data = all.filter(({ id }) => !removed.has(id));
		const rewards: ChannelReward[] = data.map(({ id, title, cost }) => ({
			id,
			title,
			cost,
		}));

		const appRewards: AppRewardStatus[] = REWARD_CONFIGS.map((config) => {
			const match = matchReward(
				data,
				context.userId,
				config.key,
				effectiveTitle(
					String(
						context.settings[`reward.${config.key}.title`] ?? config.title,
					),
				),
			);
			return {
				key: config.key,
				exists: Boolean(match),
				enabled: match?.isEnabled ?? false,
			};
		});

		return Response.json({ available: true, rewards, appRewards });
	} catch {
		return Response.json(
			{
				available: false,
				reason: "failed to load rewards, check scope and affiliate status",
				rewards: [],
			},
			{ status: 502 },
		);
	}
};

const FAILURE = (reason: string): RewardsManageResult => ({
	ok: false,
	created: [],
	deleted: 0,
	reason,
});

interface EffectiveReward {
	key: string;
	title: string;
	cost: number;
	cooldown: number;
}

const DEV_TITLE_PREFIX = "Dev: ";

function effectiveTitle(title: string): string {
	return dev ? `${DEV_TITLE_PREFIX}${title}` : title;
}

function effectiveRewards(settings: GameSettings): EffectiveReward[] {
	return REWARD_CONFIGS.map((config) => ({
		key: config.key,
		title: effectiveTitle(
			String(settings[`reward.${config.key}.title`] ?? config.title),
		),
		cost: Number(settings[`reward.${config.key}.cost`] ?? config.cost),
		cooldown: Number(
			settings[`reward.${config.key}.cooldown`] ?? config.cooldown,
		),
	}));
}

const cooldownData = (cooldown: number) =>
	cooldown > 0
		? { isGlobalCooldownEnabled: true, globalCooldownSeconds: cooldown }
		: { isGlobalCooldownEnabled: false };

export const POST: RequestHandler = async ({ request, url, cookies }) => {
	const context = await resolveContext(cookies, url);

	if (!context) {
		return Response.json(FAILURE("not authorized, visit /auth/twitch/login"), {
			status: 503,
		});
	}

	const body = (await request.json()) as {
		action?: string;
		key?: string;
		enabled?: boolean;
	};
	const { action } = body;

	try {
		const existingAll = await context.api.channelPoints.getCustomRewards(
			context.userId,
		);
		const removed = await pruneOrphanRewards(context);
		const existing = existingAll.filter(({ id }) => !removed.has(id));

		if (action === "toggle") {
			const enabled = body.enabled === true;
			const reward = effectiveRewards(context.settings).find(
				(item) => item.key === body.key,
			);
			if (!reward) {
				return Response.json(FAILURE("unknown reward key"), { status: 400 });
			}

			const existingReward = matchReward(
				existing,
				context.userId,
				reward.key,
				reward.title,
			);

			if (existingReward) {
				await context.api.channelPoints.updateCustomReward(
					context.userId,
					existingReward.id,
					{ isEnabled: enabled },
				);
				rewardIds.set(context.userId, reward.key, existingReward.id);
			} else {
				const createdReward =
					await context.api.channelPoints.createCustomReward(context.userId, {
						title: reward.title,
						cost: reward.cost,
						...cooldownData(reward.cooldown),
						isEnabled: enabled,
					});
				rewardIds.set(context.userId, reward.key, createdReward.id);
			}

			return Response.json({ ok: true, created: [], updated: [], deleted: 0 });
		}

		if (action === "create") {
			const created: string[] = [];
			const updated: string[] = [];

			for (const reward of effectiveRewards(context.settings)) {
				const existingReward = matchReward(
					existing,
					context.userId,
					reward.key,
					reward.title,
				);

				if (existingReward) {
					await context.api.channelPoints.updateCustomReward(
						context.userId,
						existingReward.id,
						{
							title: reward.title,
							cost: reward.cost,
							...cooldownData(reward.cooldown),
						},
					);
					rewardIds.set(context.userId, reward.key, existingReward.id);
					updated.push(reward.title);
					continue;
				}

				const createdReward =
					await context.api.channelPoints.createCustomReward(context.userId, {
						title: reward.title,
						cost: reward.cost,
						...cooldownData(reward.cooldown),
					});
				rewardIds.set(context.userId, reward.key, createdReward.id);
				created.push(reward.title);
			}

			return Response.json({ ok: true, created, updated, deleted: 0 });
		}

		if (action === "delete") {
			const manageable = await context.api.channelPoints.getCustomRewards(
				context.userId,
				true,
			);

			for (const reward of manageable) {
				await context.api.channelPoints.deleteCustomReward(
					context.userId,
					reward.id,
				);
			}

			rewardIds.clear(context.userId);

			return Response.json({
				ok: true,
				created: [],
				deleted: manageable.length,
			});
		}

		return Response.json(FAILURE("unknown action"), { status: 400 });
	} catch (error) {
		const status =
			error instanceof Error && "statusCode" in error
				? (error as { statusCode: number }).statusCode
				: undefined;
		const message = error instanceof Error ? error.message : String(error);
		logger.error(
			`[rewards] ${action} failed: ${status ?? "unknown"} ${message}`,
		);

		return Response.json(FAILURE("twitch api request failed"), {
			status: 502,
		});
	}
};
