export interface StoragePort {
	load(key: string): Promise<unknown>;
	save(key: string, value: unknown): Promise<void>;
}

export type StorageTransport = (uuid: string, key?: string) => StoragePort;
