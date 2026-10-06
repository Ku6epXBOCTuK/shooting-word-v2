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

	const token = await exchangeCode(
		TWITCH_CLIENT_ID ?? "",
		TWITCH_CLIENT_SECRET ?? "",
		code,
		`${url.origin}/auth/twitch/callback`,
	);

	await saveToken(token);
	resetAuthProvider();

	return new Response(
		"Twitch authorization successful, you can close this tab",
		{
			headers: { "content-type": "text/plain; charset=utf-8" },
		},
	);
};
