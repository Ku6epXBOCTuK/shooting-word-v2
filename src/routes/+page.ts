import { features } from "#lib/features/variant.js";
import { APP_VARIANT } from "$app/env/public";
import { browser, dev } from "$app/env";
import type { PageLoad } from "./$types";

const LOG_PATH = "data/debug-index.log";

export const load: PageLoad = async ({ url }) => {
	if (browser || !dev) return;

	const { appendFileSync } = await import("node:fs");
	const raw = process.env.APP_VARIANT ?? "<unset>";
	const line = `${new Date().toISOString()} variant=${APP_VARIANT} raw=${raw} rewards=${features.rewards} url=${url.pathname}\n`;
	try {
		appendFileSync(LOG_PATH, line);
	} catch {
		// data dir missing — ignore
	}
};
