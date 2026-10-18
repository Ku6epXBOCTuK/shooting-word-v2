import { logger } from "#lib/logger.js";
import { resolve } from "$app/paths";
import { QueuedStoragePort } from "./queued-port.js";

const RETRIES = 3;
const RETRY_DELAY_MS = 500;
const TERMINAL_STATUSES = new Set([401, 403, 404]);

const STORAGE_ROUTES = {
	viewers: "/api/viewers",
	settings: "/api/settings",
} as const;

export class HttpStorageAdapter extends QueuedStoragePort {
	constructor(
		private readonly uuid: string,
		private readonly key?: string,
	) {
		super();
	}

	private url(key: string): string {
		const route = STORAGE_ROUTES[key as keyof typeof STORAGE_ROUTES];
		if (!route) throw new Error(`[storage] unknown key: ${key}`);
		return `${resolve(route)}?uuid=${encodeURIComponent(this.uuid)}`;
	}

	private writeHeaders(): Record<string, string> {
		return this.key ? { "x-widget-key": this.key } : {};
	}

	protected async read(key: string): Promise<unknown> {
		try {
			const response = await fetch(this.url(key));
			if (!response.ok) return null;
			return (await response.json()) as unknown;
		} catch {
			return null;
		}
	}

	protected async write(key: string, value: unknown): Promise<void> {
		for (let attempt = 1; attempt <= RETRIES; attempt++) {
			try {
				const response = await fetch(this.url(key), {
					method: "PUT",
					headers: {
						"content-type": "application/json",
						...this.writeHeaders(),
					},
					body: JSON.stringify(value),
				});
				if (response.ok) return;
				if (TERMINAL_STATUSES.has(response.status)) {
					logger.error(
						`[storage] PUT ${key} rejected with ${response.status}, dropping`,
					);
					return;
				}
				logger.warn(
					`[storage] PUT ${key} failed with ${response.status} (attempt ${attempt}/${RETRIES})`,
				);
			} catch (error) {
				logger.warn(
					`[storage] PUT ${key} failed: ${error instanceof Error ? error.message : String(error)} (attempt ${attempt}/${RETRIES})`,
				);
			}
			if (attempt < RETRIES) {
				await new Promise((resolveDelay) =>
					setTimeout(resolveDelay, RETRY_DELAY_MS * attempt),
				);
			}
		}
		logger.error(`[storage] PUT ${key} dropped after ${RETRIES} attempts`);
	}
}
