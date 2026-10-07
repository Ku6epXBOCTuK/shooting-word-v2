import { redirect } from "@sveltejs/kit";
import { TWITCH_CLIENT_ID, TWITCH_REDIRECT_URI } from "$app/env/private";
import { TWITCH_SCOPES } from "#lib/server/twitch-auth.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ url }) => {
	const params = new URLSearchParams({
		client_id: TWITCH_CLIENT_ID ?? "",
		redirect_uri: TWITCH_REDIRECT_URI ?? `${url.origin}/auth/twitch/callback`,
		response_type: "code",
		scope: TWITCH_SCOPES.join(" "),
	});

	redirect(302, `https://id.twitch.tv/oauth2/authorize?${params}`, {
		external: true,
	});
};
