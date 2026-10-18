import { REWARDS_ENABLED } from "../variant.js";
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
	if (REWARDS_ENABLED && uuid && transport) {
		return new ViewerStore(transport(uuid, key));
	}
	return new ViewerStore(new LocalStorageAdapter());
}
