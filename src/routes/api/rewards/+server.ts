import { ApiClient } from "@twurple/api";
import {
	getAuthProvider,
	getStoredUserId,
	isConfigured,
} from "#lib/server/twitch-auth.js";
import type { RequestHandler } from "./$types";
import type { ChannelReward } from "#lib/features/rewards/port.js";

export const prerender = false;

export const GET: RequestHandler = async () => {
	if (!isConfigured()) {
		return Response.json(
			{
				available: false,
				reason: "twitch credentials are not configured",
				rewards: [],
			},
			{ status: 503 },
		);
	}

	const authProvider = await getAuthProvider();

	if (!authProvider) {
		return Response.json(
			{
				available: false,
				reason: "not authorized, visit /auth/twitch/login",
				rewards: [],
			},
			{ status: 503 },
		);
	}

	const userId = getStoredUserId();

	if (!userId) {
		return Response.json(
			{
				available: false,
				reason: "not authorized, visit /auth/twitch/login",
				rewards: [],
			},
			{ status: 503 },
		);
	}

	const api = new ApiClient({ authProvider });

	try {
		const data = await api.channelPoints.getCustomRewards(userId);
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
