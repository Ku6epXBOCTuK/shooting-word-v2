import { redirect } from "@sveltejs/kit";
import { TWITCH_SCOPES } from "#lib/server/twitch-auth.js";
import { twitchClientId, twitchRedirectUri } from "#lib/server/twitch-env.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = ({ url }) => {
	const params = new URLSearchParams({
		client_id: twitchClientId(),
		redirect_uri: twitchRedirectUri(`${url.origin}/auth/twitch/callback`),
		response_type: "code",
		scope: TWITCH_SCOPES.join(" "),
	});

	redirect(302, `https://id.twitch.tv/oauth2/authorize?${params}`, {
		external: true,
	});
};
