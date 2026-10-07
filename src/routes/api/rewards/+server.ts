import { broadcasters } from "#lib/server/broadcasters/index.js";
import { rewardIds } from "#lib/server/reward-ids/index.js";
import { getApiClient } from "#lib/server/twitch-auth.js";
import type { RequestHandler } from "./$types";
import type {
	ChannelReward,
	RewardsManageResult,
} from "#lib/features/rewards/port.js";
import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
import { logger } from "#lib/logger.js";

export const prerender = false;

async function resolveContext(url: URL) {
	const uuid = url.searchParams.get("uuid");
	const broadcaster = uuid ? broadcasters.byUuid(uuid) : null;
	if (!broadcaster) return null;

	const api = await getApiClient(broadcaster);
	if (!api) return null;

	return { api, userId: broadcaster.userId };
}

const NOT_AUTHORIZED = {
	available: false,
	reason: "not authorized, visit /auth/twitch/login",
	rewards: [],
};

export const GET: RequestHandler = async ({ url }) => {
	const context = await resolveContext(url);

	if (!context) {
		return Response.json(NOT_AUTHORIZED, { status: 503 });
	}

	try {
		const data = await context.api.channelPoints.getCustomRewards(
			context.userId,
		);
		const rewards: ChannelReward[] = data.map(({ id, title, cost }) => ({
			id,
			title,
			cost,
		}));

		return Response.json({ available: true, rewards });
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

export const POST: RequestHandler = async ({ request, url }) => {
	const context = await resolveContext(url);

	if (!context) {
		return Response.json(FAILURE("not authorized, visit /auth/twitch/login"), {
			status: 503,
		});
	}

	const { action } = (await request.json()) as { action?: string };

	try {
		const existing = await context.api.channelPoints.getCustomRewards(
			context.userId,
		);

		if (action === "create") {
			const created: string[] = [];

			for (const config of REWARD_CONFIGS) {
				const existingReward = existing.find(
					(reward) => reward.title === config.title,
				);

				if (existingReward) {
					rewardIds.set(context.userId, config.key, existingReward.id);
					continue;
				}

				const reward = await context.api.channelPoints.createCustomReward(
					context.userId,
					{ title: config.title, cost: config.cost },
				);
				rewardIds.set(context.userId, config.key, reward.id);
				created.push(config.title);
			}

			return Response.json({ ok: true, created, deleted: 0 });
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
