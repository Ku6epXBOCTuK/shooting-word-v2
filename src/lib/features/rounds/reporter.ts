import { isHttpError } from "@sveltejs/kit";
import { reportRound as reportRoundCommand } from "#lib/features/widget/widget.remote.js";
import { logger } from "#lib/logger.js";
import type { RoundRecord } from "./record.js";

export function reportRound(
	uuid: string,
	record: RoundRecord,
	key?: string,
): void {
	void reportRoundCommand({ uuid, key, record }).catch((error: unknown) => {
		logger.warn(
			isHttpError(error) && error.status === 403
				? "[rounds] report rejected: widget key is not the owner"
				: `[rounds] report failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	});
}
