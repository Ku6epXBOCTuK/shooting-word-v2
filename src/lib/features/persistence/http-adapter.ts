import { resolve } from "$app/paths";
import { logger } from "#lib/logger.js";
import type { StoragePort } from "./port.js";

const RETRIES = 3;
const RETRY_DELAY_MS = 500;
const TERMINAL_STATUSES = new Set([401, 403, 404]);

export class HttpStorageAdapter implements StoragePort {
	// NOTE: only the latest snapshot is kept: writes never accumulate.
	private queued: { key: string; value: unknown } | null = null;
	private chain: Promise<void> = Promise.resolve();

	constructor(
		private readonly uuid: string,
		private readonly key?: string,
	) {}

	private url(key: string): string {
		return `${resolve("/api/storage/[key]", { key })}?uuid=${encodeURIComponent(this.uuid)}`;
	}

	private writeHeaders(): Record<string, string> {
		return this.key ? { "x-widget-key": this.key } : {};
	}

	async load(key: string): Promise<unknown> {
		try {
			const response = await fetch(this.url(key));
			if (!response.ok) return null;
			return (await response.json()) as unknown;
		} catch {
			return null;
		}
	}

	// NOTE: writes go through one chain, each awaiting the previous one, so snapshots
	// can never reach the server out of order. Errors are retried, not swallowed.
	save(key: string, value: unknown): Promise<void> {
		this.queued = { key, value };
		this.chain = this.chain.then(() => {
			const job = this.queued;
			this.queued = null;
			return job ? this.put(job.key, job.value) : Promise.resolve();
		});
		return this.chain;
	}

	private async put(key: string, value: unknown): Promise<void> {
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
