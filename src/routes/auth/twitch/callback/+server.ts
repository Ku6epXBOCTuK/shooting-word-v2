import { exchangeCode, getTokenInfo } from "@twurple/auth";
import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } from "$app/env/private";
import { broadcasters } from "#lib/server/broadcasters/index.js";
import { logger } from "#lib/logger.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get("code");
	const error = url.searchParams.get("error");

	if (error || !code) {
		return new Response(`Authorization failed: ${error ?? "no code"}`, {
			status: 400,
		});
	}

	try {
		const token = await exchangeCode(
			TWITCH_CLIENT_ID ?? "",
			TWITCH_CLIENT_SECRET ?? "",
			code,
			`${url.origin}/auth/twitch/callback`,
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

		return new Response(
			`<!doctype html>
<html lang="ru">
	<head>
		<meta charset="utf-8" />
		<meta http-equiv="refresh" content="3;url=/${broadcaster.widgetUuid}" />
		<title>Авторизация успешна</title>
	</head>
	<body>
		<p>Twitch authorization successful. Redirecting in 3 seconds…</p>
		<script>
			setTimeout(() => {
				window.location.href = "/${broadcaster.widgetUuid}";
			}, 3000);
		</script>
	</body>
</html>`,
			{ headers: { "content-type": "text/html; charset=utf-8" } },
		);
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
};
