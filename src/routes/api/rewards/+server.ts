import { ApiClient } from "@twurple/api";
import {
	getAuthProvider,
	getStoredUserId,
	isConfigured,
} from "#lib/server/twitch-auth.js";
import type { RequestHandler } from "./$types";
import type {
	ChannelReward,
	RewardsManageResult,
} from "#lib/features/rewards/port.js";
import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";

export const prerender = false;

async function resolveContext() {
	if (!isConfigured()) return null;

	const authProvider = await getAuthProvider();
	if (!authProvider) return null;

	const userId = getStoredUserId();
	if (!userId) return null;

	return { api: new ApiClient({ authProvider }), userId };
}

const NOT_AUTHORIZED = {
	available: false,
	reason: "not authorized, visit /auth/twitch/login",
	rewards: [],
};

export const GET: RequestHandler = async () => {
	const context = await resolveContext();

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

export const POST: RequestHandler = async ({ request }) => {
	const context = await resolveContext();

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
				if (existing.some((reward) => reward.title === config.title)) {
					continue;
				}

				await context.api.channelPoints.createCustomReward(context.userId, {
					title: config.title,
					cost: config.cost,
				});
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
		console.error(
			`[rewards] ${action} failed: ${status ?? "unknown"} ${message}`,
		);

		return Response.json(FAILURE("twitch api request failed"), {
			status: 502,
		});
	}
};
