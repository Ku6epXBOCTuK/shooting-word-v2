import { normalizeSettings, type GameSettings } from "#lib/game/settings.js";
import { dev } from "$app/env";
import { REWARDS_ENABLED } from "../variant.js";
import { HttpStorageAdapter } from "./http-adapter.js";
import { LocalStorageAdapter } from "./local-storage-adapter.js";
import type { StorageTransport } from "./port.js";
import { ViewerStore } from "./viewer-store.js";

export type { StoragePort, StorageTransport } from "./port.js";
export {
	CONSUMABLE_FIELDS,
	mergeProfile,
	ViewerStore,
} from "./viewer-store.js";
export type {
	ConsumableField,
	ConsumableSync,
	StoredViewer,
} from "./viewer-store.js";

export function createViewerStore(
	uuid?: string,
	key?: string,
	transport?: StorageTransport,
): ViewerStore {
	if (REWARDS_ENABLED && uuid) {
		return new ViewerStore(
			transport ? transport(uuid, key) : new HttpStorageAdapter(uuid, key),
		);
	}
	return new ViewerStore(new LocalStorageAdapter());
}

export async function loadServerSettings(
	uuid: string,
): Promise<GameSettings | null> {
	if (!REWARDS_ENABLED) return null;
	const raw = await new HttpStorageAdapter(uuid).load("settings");
	return raw ? normalizeSettings(raw, undefined, dev) : null;
}
