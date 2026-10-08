import { redirect } from "@sveltejs/kit";
import { exchangeCode, getTokenInfo } from "@twurple/auth";
import {
	TWITCH_CLIENT_ID,
	TWITCH_CLIENT_SECRET,
	TWITCH_REDIRECT_URI,
} from "$app/env/private";
import { broadcasters } from "#lib/server/broadcasters/index.js";
import { SESSION_COOKIE, sessions } from "#lib/server/sessions/index.js";
import { SESSION_TTL_MS } from "#lib/server/sessions/sqlite-adapter.js";
import { logger } from "#lib/logger.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get("code");
	const error = url.searchParams.get("error");

	if (error || !code) {
		return new Response(`Authorization failed: ${error ?? "no code"}`, {
			status: 400,
		});
	}

	let broadcasterUserId: string;
	try {
		const token = await exchangeCode(
			TWITCH_CLIENT_ID ?? "",
			TWITCH_CLIENT_SECRET ?? "",
			code,
			TWITCH_REDIRECT_URI ?? `${url.origin}/auth/twitch/callback`,
		);

		const info = await getTokenInfo(token.accessToken, TWITCH_CLIENT_ID);
		if (!info.userId) {
			throw new Error("token validation failed");
		}

		const broadcaster = broadcasters.upsert(
			info.userId,
			info.userName ?? info.userId,
			token,
		);
		broadcasterUserId = broadcaster.userId;
	} catch (err) {
		const status =
			err instanceof Error && "statusCode" in err
				? (err as { statusCode: number }).statusCode
				: undefined;
		logger.error(
			`[auth] code exchange failed with status ${status ?? "unknown"}`,
		);

		return new Response(
			"Authorization code is invalid or already used, try /auth/twitch/login again",
			{ status: 400 },
		);
	}

	const sessionToken = sessions.create(broadcasterUserId);
	cookies.set(SESSION_COOKIE, sessionToken, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure: url.protocol === "https:",
		maxAge: Math.floor(SESSION_TTL_MS / 1000),
	});

	redirect(302, "/cabinet");
};
