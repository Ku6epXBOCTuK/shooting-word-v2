import type { StoragePort } from "./port.js";

const PREFIX = "shooting-word:";

export class LocalStorageAdapter implements StoragePort {
	async load(key: string): Promise<unknown> {
		try {
			const raw = localStorage.getItem(PREFIX + key);
			if (!raw) return null;
			return JSON.parse(raw) as unknown;
		} catch {
			return null;
		}
	}

	async save(key: string, value: unknown): Promise<void> {
		try {
			localStorage.setItem(PREFIX + key, JSON.stringify(value));
		} catch {
			// storage full or unavailable — ignore
		}
	}
}
