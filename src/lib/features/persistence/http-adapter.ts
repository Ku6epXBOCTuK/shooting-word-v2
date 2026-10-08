import { resolve } from "$app/paths";
import type { StoragePort } from "./port.js";

export class HttpStorageAdapter implements StoragePort {
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

	async save(key: string, value: unknown): Promise<void> {
		try {
			await fetch(this.url(key), {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(value),
			});
		} catch {
			// endpoint unavailable — skip this sync
		}
	}
}
