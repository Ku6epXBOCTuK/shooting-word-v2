import { resolve } from "$app/paths";
import { logger } from "#lib/logger.js";

const KEY_PREFIX = "sw-widget-key:";

export type ClaimResult =
	"first" | "owner" | "duplicate" | "notFound" | "unavailable";

export function getOrCreateWidgetKey(uuid: string): string {
	const storageKey = `${KEY_PREFIX}${uuid}`;
	const existing = localStorage.getItem(storageKey);
	if (existing) return existing;
	const key = crypto.randomUUID();
	localStorage.setItem(storageKey, key);
	return key;
}

export async function claimWidget(
	uuid: string,
	key: string,
): Promise<ClaimResult> {
	let response: Response;
	try {
		response = await fetch(resolve("/api/widget/claim"), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ uuid, key }),
		});
	} catch (error) {
		logger.warn(
			`[widget] claim failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		return "unavailable";
	}
	if (response.status === 404) return "notFound";
	if (!response.ok) return "unavailable";
	const body = (await response.json()) as { status?: string };
	if (
		body.status === "first" ||
		body.status === "owner" ||
		body.status === "duplicate"
	) {
		return body.status;
	}
	return "unavailable";
}
