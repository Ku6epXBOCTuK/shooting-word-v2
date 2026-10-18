import {
	viewersLoad,
	viewersSave,
} from "#lib/features/widget/widget.remote.js";
import { QueuedStoragePort } from "./queued-port.js";

const VIEWERS_KEY = "viewers";

export class RemoteStorageAdapter extends QueuedStoragePort {
	constructor(
		private readonly uuid: string,
		private readonly key?: string,
	) {
		super();
	}

	protected async read(key: string): Promise<unknown> {
		this.assertKey(key);
		return await viewersLoad({ uuid: this.uuid, key: this.key });
	}

	protected async write(key: string, value: unknown): Promise<void> {
		this.assertKey(key);
		await viewersSave({
			uuid: this.uuid,
			key: this.key,
			viewers: value as unknown[],
		});
	}

	private assertKey(key: string): void {
		if (key !== VIEWERS_KEY) throw new Error(`[storage] unknown key: ${key}`);
	}
}
