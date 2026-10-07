import { ensureShieldFeature, getActiveShields } from "#lib/server/shields.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

export const GET: RequestHandler = () => {
	ensureShieldFeature();
	return Response.json({ shields: getActiveShields() });
};
