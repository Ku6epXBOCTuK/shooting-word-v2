import { logger } from "#lib/logger.ts";
import "#lib/server/log-file.js";
import type { HandleServerError } from "@sveltejs/kit/hooks";

export const handleError: HandleServerError = (input) => {
	// NOTE: app errors come from error() and are expected client responses,
	// their status and message are already the response body.
	if (input.kind === "app") return;

	logger.error(input.error, input.event);
};
