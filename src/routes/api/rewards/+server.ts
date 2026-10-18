import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
import type {
	AppRewardStatus,
	RewardValues,
	RewardsManageResult,
} from "#lib/features/rewards/port.js";
import {
	defaultRewardValues,
	normalizeValues,
} from "#lib/features/rewards/settings.js";
import { logger } from "#lib/logger.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { rewardIds } from "#lib/server/reward-ids/index.js";
import { planRewardPrune } from "#lib/server/reward-ids/prune.js";
import { deleteRewardWithRefund } from "#lib/server/reward-delete.js";
import { getApiClient } from "#lib/server/twitch-auth.js";
import type { Cookies } from "@sveltejs/kit";
import type { ApiClient, HelixCustomReward } from "@twurple/api";
import type { RequestHandler } from "./$types";

export const prerender = false;

async function resolveContext(cookies: Cookies, url: URL) {
	const broadcaster = resolveBroadcaster(cookies, url);
	if (!broadcaster) return null;

	const api = await getApiClient(broadcaster);
	if (!api) return null;

	return { api, userId: broadcaster.userId };
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

const liveValues = (reward: HelixCustomReward): RewardValues => ({
	title: reward.title,
	description: reward.prompt ?? "",
	cost: reward.cost,
	cooldown: reward.globalCooldown ?? 0,
});

const NOT_AUTHORIZED = {
	available: false,
	reason: "not authorized, visit /auth/twitch/login",
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

		const appRewards: AppRewardStatus[] = REWARD_CONFIGS.map((config) => {
			const match = matchReward(
				data,
				context.userId,
				config.key,
				defaultRewardValues(config.key).title,
			);

			return {
				key: config.key,
				exists: Boolean(match),
				enabled: match?.isEnabled ?? false,
				live: match ? liveValues(match) : undefined,
			};
		});

		return Response.json({ available: true, appRewards });
	} catch {
		return Response.json(
			{
				available: false,
				reason: "failed to load rewards, check scope and affiliate status",
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

const cooldownData = (cooldown: number) =>
	cooldown > 0
		? { isGlobalCooldownEnabled: true, globalCooldownSeconds: cooldown }
		: { isGlobalCooldownEnabled: false };

const rewardData = (values: RewardValues) => ({
	title: values.title,
	cost: values.cost,
	prompt: values.description,
	...cooldownData(values.cooldown),
});

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
		refund?: boolean;
		values?: unknown;
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
			const config = REWARD_CONFIGS.find((item) => item.key === body.key);
			if (!config) {
				return Response.json(FAILURE("unknown reward key"), { status: 400 });
			}

			const values = defaultRewardValues(config.key);
			const existingReward = matchReward(
				existing,
				context.userId,
				config.key,
				values.title,
			);

			if (existingReward) {
				await context.api.channelPoints.updateCustomReward(
					context.userId,
					existingReward.id,
					{ isEnabled: enabled },
				);
				rewardIds.set(context.userId, config.key, existingReward.id);
			} else {
				const createdReward =
					await context.api.channelPoints.createCustomReward(context.userId, {
						...rewardData(values),
						isEnabled: enabled,
					});
				rewardIds.set(context.userId, config.key, createdReward.id);
			}

			return Response.json({ ok: true, created: [], updated: [], deleted: 0 });
		}

		if (action === "update-all") {
			const created: string[] = [];
			const updated: string[] = [];

			for (const config of REWARD_CONFIGS) {
				const values = defaultRewardValues(config.key);
				const existingReward = matchReward(
					existing,
					context.userId,
					config.key,
					values.title,
				);

				if (existingReward) {
					await context.api.channelPoints.updateCustomReward(
						context.userId,
						existingReward.id,
						rewardData(values),
					);
					rewardIds.set(context.userId, config.key, existingReward.id);
					updated.push(values.title);
					continue;
				}

				const createdReward =
					await context.api.channelPoints.createCustomReward(
						context.userId,
						rewardData(values),
					);
				rewardIds.set(context.userId, config.key, createdReward.id);
				created.push(values.title);
			}

			return Response.json({ ok: true, created, updated, deleted: 0 });
		}

		if (action === "update") {
			const key = body.key;
			if (!key) {
				return Response.json(FAILURE("missing `key`"), { status: 400 });
			}
			if (!REWARD_CONFIGS.some((item) => item.key === key)) {
				return Response.json(FAILURE("unknown reward key"), { status: 400 });
			}

			const values = normalizeValues(body.values);
			if (!values) {
				return Response.json(FAILURE("invalid reward values"), {
					status: 400,
				});
			}

			const existingReward = matchReward(
				existing,
				context.userId,
				key,
				values.title,
			);

			if (existingReward) {
				await context.api.channelPoints.updateCustomReward(
					context.userId,
					existingReward.id,
					rewardData(values),
				);
				rewardIds.set(context.userId, key, existingReward.id);
				return Response.json({
					ok: true,
					created: [],
					updated: [values.title],
					deleted: 0,
				});
			}

			const createdReward = await context.api.channelPoints.createCustomReward(
				context.userId,
				rewardData(values),
			);
			rewardIds.set(context.userId, key, createdReward.id);
			return Response.json({
				ok: true,
				created: [values.title],
				updated: [],
				deleted: 0,
			});
		}

		if (action === "delete") {
			const refund = body.refund === true;

			if (body.key) {
				const config = REWARD_CONFIGS.find((item) => item.key === body.key);
				if (!config) {
					return Response.json(FAILURE("unknown reward key"), { status: 400 });
				}

				const target = matchReward(
					existing,
					context.userId,
					config.key,
					defaultRewardValues(config.key).title,
				);
				if (!target) {
					return Response.json({
						ok: false,
						created: [],
						deleted: 0,
						reason: "reward not created on Twitch yet",
					});
				}

				const refunded = await deleteRewardWithRefund(
					context.api,
					context.userId,
					target.id,
					refund,
				);
				rewardIds.remove(context.userId, config.key);

				return Response.json({
					ok: true,
					created: [],
					deleted: 1,
					refunded,
				});
			}

			const manageable = await context.api.channelPoints.getCustomRewards(
				context.userId,
				true,
			);

			let refunded = 0;
			for (const reward of manageable) {
				refunded += await deleteRewardWithRefund(
					context.api,
					context.userId,
					reward.id,
					refund,
				);
			}

			rewardIds.clear(context.userId);

			return Response.json({
				ok: true,
				created: [],
				deleted: manageable.length,
				refunded,
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
