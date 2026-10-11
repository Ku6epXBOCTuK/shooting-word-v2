import type { RoundRecord } from "#lib/features/rounds/record.js";

export interface RoundsRepo {
	add(broadcasterId: string, record: RoundRecord): void;
	recent(broadcasterId: string, limit: number): RoundRecord[];
}
