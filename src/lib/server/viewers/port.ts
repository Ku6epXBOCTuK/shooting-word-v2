import type { ConsumableField } from "#lib/features/persistence/index.js";

export interface ViewerProfile {
	userId: string;
	data: unknown;
	updatedAt: number;
}

export interface ViewersRepo {
	load<T>(broadcasterId: string): T[];
	get<T>(broadcasterId: string, userId: string): T | null;
	// NOTE: merges by userId: profiles outside the batch are left untouched and a
	// row with an older updatedAt never overwrites a fresher one.
	upsert(broadcasterId: string, profiles: ViewerProfile[]): void;
	// NOTE: grants on the server independently of the widget (the reward survives
	// a closed widget) and returns the new absolute value, which the widget applies
	// as a sync rather than `+1`.
	increment(
		broadcasterId: string,
		userId: string,
		field: ConsumableField,
		delta: number,
		cap: number,
		meta: { user: string },
	): number;
}
