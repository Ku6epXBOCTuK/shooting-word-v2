import type { StoragePort } from "./port.js";

// NOTE: only the latest snapshot is kept - writes never accumulate - and each
// write awaits the previous one, so snapshots cannot reach the server out of order.
export abstract class QueuedStoragePort implements StoragePort {
	private queued: { key: string; value: unknown } | null = null;
	private chain: Promise<void> = Promise.resolve();

	load(key: string): Promise<unknown> {
		return this.read(key);
	}

	save(key: string, value: unknown): Promise<void> {
		this.queued = { key, value };
		this.chain = this.chain.then(() => {
			const job = this.queued;
			this.queued = null;
			return job ? this.write(job.key, job.value) : Promise.resolve();
		});
		return this.chain;
	}

	protected abstract read(key: string): Promise<unknown>;
	protected abstract write(key: string, value: unknown): Promise<void>;
}
