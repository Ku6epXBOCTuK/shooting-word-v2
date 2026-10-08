export interface SessionsRepo {
	create(broadcasterId: string): string;
	resolve(token: string): string | null;
	remove(token: string): void;
	removeForBroadcaster(broadcasterId: string): void;
}
