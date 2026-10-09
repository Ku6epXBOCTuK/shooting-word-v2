export interface StorageRepo {
	load<T>(broadcasterId: string, key: string): T | null;
	save(broadcasterId: string, key: string, value: unknown): void;
}
