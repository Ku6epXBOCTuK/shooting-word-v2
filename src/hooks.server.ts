import { logger } from "#lib/logger.ts";
import "#lib/server/log-file.js";
import type { HandleServerError } from "@sveltejs/kit/hooks";

export const handleError: HandleServerError = ({ error, event }) => {
	logger.error(error, event);
};
