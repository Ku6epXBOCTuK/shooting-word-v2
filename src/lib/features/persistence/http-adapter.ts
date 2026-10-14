import { resolve } from "$app/paths";
import { logger } from "#lib/logger.js";
import type { StoragePort } from "./port.js";

const RETRIES = 3;
const RETRY_DELAY_MS = 500;

export class HttpStorageAdapter implements StoragePort {
	/** Последний снапшот вытесняет предыдущие: запись не накапливается. */
	private queued: { key: string; value: unknown } | null = null;
	private chain: Promise<void> = Promise.resolve();

	constructor(private readonly uuid: string) {}

	private url(key: string): string {
		return `${resolve("/api/storage/[key]", { key })}?uuid=${encodeURIComponent(this.uuid)}`;
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

	/**
	 * Записи идут в одну очередь (каждая ждёт предыдущую) — снапшоты не могут
	 * прийти на сервер в обратном порядке. Ошибки ретраятся, а не глотаются.
	 */
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
					headers: { "content-type": "application/json" },
					body: JSON.stringify(value),
				});
				if (response.ok) return;
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
