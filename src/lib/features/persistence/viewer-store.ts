import type { Viewer } from "../../game/types.js";
import type { StoragePort } from "./port.js";

const KEY = "viewers";

export type StoredViewer = Viewer & { xp: number };

function isStoredViewer(value: unknown): value is StoredViewer {
	if (typeof value !== "object" || value === null) return false;
	const viewer = value as Record<string, unknown>;
	return (
		typeof viewer.userId === "string" &&
		typeof viewer.user === "string" &&
		typeof viewer.lastSeen === "number" &&
		(viewer.xp === undefined || typeof viewer.xp === "number") &&
		(viewer.skin === undefined || typeof viewer.skin === "number")
	);
}

export class ViewerStore {
	constructor(private readonly storage: StoragePort) {}

	async load(): Promise<StoredViewer[]> {
		const parsed = await this.storage.load(KEY);
		if (!Array.isArray(parsed)) return [];

		return parsed.filter(isStoredViewer).map((viewer) => ({
			...viewer,
			xp: viewer.xp ?? 0,
			skin: viewer.skin ?? 0,
		}));
	}

	async save(viewers: StoredViewer[]): Promise<void> {
		await this.storage.save(KEY, viewers);
	}
}
