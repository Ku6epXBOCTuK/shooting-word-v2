import { logger } from "#lib/logger.ts";
import "#lib/server/log-file.js";
import type { Handle, HandleServerError } from "@sveltejs/kit/hooks";

const SLOW_REMOTE_MS = 1_000;

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.isRemoteRequest) return resolve(event);

	const started = performance.now();
	const response = await resolve(event);
	const duration = Math.round(performance.now() - started);

	if (duration >= SLOW_REMOTE_MS) {
		logger.warn(`[remote] slow call ${event.url.pathname}: ${duration}ms`);
	}

	return response;
};

export const handleError: HandleServerError = (input) => {
	// NOTE: app errors come from error() and are expected client responses,
	// their status and message are already the response body.
	if (input.kind === "app") return;

	logger.error(input.error, input.event);
};
