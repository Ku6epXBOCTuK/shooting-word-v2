import { redirect } from "@sveltejs/kit";
import { clearStoredAuth } from "#lib/server/twitch-auth.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = async () => {
	await clearStoredAuth();
	redirect(302, "/");
};
