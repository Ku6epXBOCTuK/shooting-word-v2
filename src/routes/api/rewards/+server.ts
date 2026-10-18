import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
import type {
	AppRewardStatus,
	RewardsManageResult,
} from "#lib/features/rewards/port.js";
import {
	effectiveRewards,
	isDiverged,
	normalizeRewards,
	stripDevTitle,
} from "#lib/features/rewards/settings.js";
import { logger } from "#lib/logger.js";
import { resolveBroadcaster } from "#lib/server/resolve-broadcaster.js";
import { rewardIds } from "#lib/server/reward-ids/index.js";
import { planRewardPrune } from "#lib/server/reward-ids/prune.js";
import { deleteRewardWithRefund } from "#lib/server/reward-delete.js";
import { rewardSettings } from "#lib/server/reward-settings/index.js";
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

	const rewards = normalizeRewards(rewardSettings.load(broadcaster.userId));

	return { api, userId: broadcaster.userId, rewards };
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

		const effRewards = effectiveRewards(context.rewards);
		const appRewards: AppRewardStatus[] = REWARD_CONFIGS.map((config) => {
			const effective = effRewards.find((item) => item.key === config.key);
			const match = matchReward(
				data,
				context.userId,
				config.key,
				effective?.title ?? config.title,
			);
			const diverged =
				match !== undefined &&
				effective !== undefined &&
				isDiverged(effective, {
					title: match.title,
					cost: match.cost,
					prompt: match.prompt,
					globalCooldown: match.globalCooldown,
				});
			return {
				key: config.key,
				exists: Boolean(match),
				enabled: match?.isEnabled ?? false,
				diverged,
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
			const reward = effectiveRewards(context.rewards).find(
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
						prompt: reward.description,
						...cooldownData(reward.cooldown),
						isEnabled: enabled,
					});
				rewardIds.set(context.userId, reward.key, createdReward.id);
			}

			return Response.json({ ok: true, created: [], updated: [], deleted: 0 });
		}

		if (action === "update-all") {
			const created: string[] = [];
			const updated: string[] = [];

			for (const reward of effectiveRewards(context.rewards)) {
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
							prompt: reward.description,
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
						prompt: reward.description,
						...cooldownData(reward.cooldown),
					});
				rewardIds.set(context.userId, reward.key, createdReward.id);
				created.push(reward.title);
			}

			return Response.json({ ok: true, created, updated, deleted: 0 });
		}
		if (action === "update") {
			const key = body.key;
			if (!key) {
				return Response.json(FAILURE("missing `key`"), { status: 400 });
			}
			const reward = effectiveRewards(context.rewards).find(
				(item) => item.key === key,
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
					{
						title: reward.title,
						cost: reward.cost,
						prompt: reward.description,
						...cooldownData(reward.cooldown),
					},
				);
				rewardIds.set(context.userId, reward.key, existingReward.id);
				return Response.json({
					ok: true,
					created: [],
					updated: [reward.title],
					deleted: 0,
				});
			}

			const createdReward = await context.api.channelPoints.createCustomReward(
				context.userId,
				{
					title: reward.title,
					cost: reward.cost,
					prompt: reward.description,
					...cooldownData(reward.cooldown),
				},
			);
			rewardIds.set(context.userId, reward.key, createdReward.id);
			return Response.json({
				ok: true,
				created: [reward.title],
				updated: [],
				deleted: 0,
			});
		}

		if (action === "import") {
			const key = body.key;
			if (!key) {
				return Response.json(FAILURE("missing `key`"), { status: 400 });
			}
			const effective = effectiveRewards(context.rewards).find(
				(item) => item.key === key,
			);
			if (!effective) {
				return Response.json(FAILURE("unknown reward key"), { status: 400 });
			}

			const existingReward = matchReward(
				existing,
				context.userId,
				key,
				effective.title,
			);
			if (!existingReward) {
				return Response.json({
					ok: false,
					reason: "reward not created on Twitch yet",
				});
			}

			return Response.json({
				ok: true,
				overrides: {
					title: stripDevTitle(existingReward.title),
					description: existingReward.prompt ?? "",
					cost: existingReward.cost,
					cooldown: existingReward.globalCooldown ?? 0,
				},
			});
		}

		if (action === "delete") {
			const refund = body.refund === true;

			if (body.key) {
				const effective = effectiveRewards(context.rewards).find(
					(item) => item.key === body.key,
				);
				if (!effective) {
					return Response.json(FAILURE("unknown reward key"), { status: 400 });
				}

				const target = matchReward(
					existing,
					context.userId,
					body.key,
					effective.title,
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
				rewardIds.remove(context.userId, body.key);

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
