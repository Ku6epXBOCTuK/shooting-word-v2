import { normalizeSettings, type GameSettings } from "#lib/game/settings.js";
import { features } from "../variant.js";
import { HttpStorageAdapter } from "./http-adapter.js";
import { LocalStorageAdapter } from "./local-storage-adapter.js";
import { ViewerStore } from "./viewer-store.js";

export type { StoragePort } from "./port.js";
export { ViewerStore } from "./viewer-store.js";
export type { StoredViewer } from "./viewer-store.js";

export function createViewerStore(uuid?: string): ViewerStore {
	if (features.rewards && uuid) {
		return new ViewerStore(new HttpStorageAdapter(uuid));
	}
	return new ViewerStore(new LocalStorageAdapter());
}

export async function loadServerSettings(
	uuid: string,
): Promise<GameSettings | null> {
	if (!features.rewards) return null;
	const raw = await new HttpStorageAdapter(uuid).load("settings");
	return raw ? normalizeSettings(raw) : null;
}
