export interface SettingsRepo {
	load<T>(broadcasterId: string): T | null;
	save(broadcasterId: string, value: unknown): void;
}
