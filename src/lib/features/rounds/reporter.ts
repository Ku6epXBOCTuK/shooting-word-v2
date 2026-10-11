import { resolve } from "$app/paths";
import { logger } from "#lib/logger.js";
import type { RoundRecord } from "./record.js";

export function reportRound(uuid: string, record: RoundRecord): void {
	void fetch(`${resolve("/api/rounds")}?uuid=${encodeURIComponent(uuid)}`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(record),
	}).catch((error: unknown) => {
		logger.warn(
			`[rounds] report failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	});
}
