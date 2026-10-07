import { LocalStorageAdapter } from "./local-storage-adapter.js";
import { ViewerStore } from "./viewer-store.js";

export type { StoragePort } from "./port.js";
export { ViewerStore } from "./viewer-store.js";
export type { StoredViewer } from "./viewer-store.js";

export function createViewerStore(): ViewerStore {
	return new ViewerStore(new LocalStorageAdapter());
}
