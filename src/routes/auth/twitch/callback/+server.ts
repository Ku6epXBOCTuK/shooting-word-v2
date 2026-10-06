import { exchangeCode } from "@twurple/auth";
import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } from "$app/env/private";
import { resetAuthProvider, saveToken } from "#lib/server/twitch-auth.js";
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

		const validateResponse = await fetch(
			"https://id.twitch.tv/oauth2/validate",
			{ headers: { Authorization: `OAuth ${token.accessToken}` } },
		);
		if (!validateResponse.ok) {
			throw new Error("token validation failed");
		}
		const info = (await validateResponse.json()) as { user_id: string };

		await saveToken(info.user_id, token);
		resetAuthProvider();

		return new Response(
			`<!doctype html>
<html lang="ru">
	<head>
		<meta charset="utf-8" />
		<meta http-equiv="refresh" content="3;url=/" />
		<title>Авторизация успешна</title>
	</head>
	<body>
		<p>Twitch authorization successful. Redirecting in 3 seconds…</p>
		<script>
			setTimeout(() => {
				window.location.href = "/";
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
		console.error(
			`[auth] code exchange failed with status ${status ?? "unknown"}`,
		);

		return new Response(
			"Authorization code is invalid or already used, try /auth/twitch/login again",
			{ status: 400 },
		);
	}
};
