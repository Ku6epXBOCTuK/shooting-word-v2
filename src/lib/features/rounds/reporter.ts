import { resolve } from "$app/paths";
import { logger } from "#lib/logger.js";
import type { RoundRecord } from "./record.js";

export function reportRound(
	uuid: string,
	record: RoundRecord,
	key?: string,
): void {
	void fetch(`${resolve("/api/rounds")}?uuid=${encodeURIComponent(uuid)}`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			...(key ? { "x-widget-key": key } : {}),
		},
		body: JSON.stringify(record),
	})
		.then((response) => {
			if (response.status === 403) {
				logger.warn("[rounds] report rejected: widget key is not the owner");
			}
		})
		.catch((error: unknown) => {
			logger.warn(
				`[rounds] report failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		});
}
