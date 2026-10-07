export interface ViewerEntry {
	userId: string;
	data: unknown;
}

export interface ViewersRepo {
	load<T>(broadcasterId: string): T[];
	save(broadcasterId: string, viewers: ViewerEntry[]): void;
}
