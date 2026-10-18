import type { DatabaseSync } from "node:sqlite";
import type { RoundOutcome, RoundRecord } from "#lib/features/rounds/record.js";
import type { RoundsRepo } from "./port.js";

export const ROUNDS_KEPT_PER_BROADCASTER = 1000;

interface RoundRow {
	started_at: number;
	duration_sec: number;
	outcome: string;
	afk: number;
	viewers: number;
	deaths: number;
	revives: number;
	words_spawned: number;
	words_expired: number;
	max_enemies: number;
	kills: number;
	misses: number;
	heals: number;
	doomsday: number;
	avg_enemies: number;
	avg_hp_fraction: number;
}

const toRecord = (row: RoundRow): RoundRecord => ({
	startedAt: row.started_at,
	durationSec: row.duration_sec,
	outcome: row.outcome as RoundOutcome,
	afk: row.afk === 1,
	viewers: row.viewers,
	deaths: row.deaths,
	revives: row.revives,
	wordsSpawned: row.words_spawned,
	wordsExpired: row.words_expired,
	maxEnemies: row.max_enemies,
	kills: row.kills,
	misses: row.misses,
	heals: row.heals,
	doomsday: row.doomsday,
	avgEnemies: row.avg_enemies,
	avgHpFraction: row.avg_hp_fraction,
});

export class SqliteRoundsRepo implements RoundsRepo {
	constructor(private readonly db: DatabaseSync) {}

	add(broadcasterId: string, record: RoundRecord): void {
		this.db
			.prepare(
				`INSERT INTO rounds (
					broadcaster_id, started_at, duration_sec, outcome, afk,
					viewers, deaths, revives, words_spawned, words_expired,
					max_enemies, kills, misses, heals, doomsday,
					avg_enemies, avg_hp_fraction
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.run(
				broadcasterId,
				record.startedAt,
				record.durationSec,
				record.outcome,
				record.afk ? 1 : 0,
				record.viewers,
				record.deaths,
				record.revives,
				record.wordsSpawned,
				record.wordsExpired,
				record.maxEnemies,
				record.kills,
				record.misses,
				record.heals,
				record.doomsday,
				record.avgEnemies,
				record.avgHpFraction,
			);

		this.prune(broadcasterId);
	}

	recent(broadcasterId: string, limit: number): RoundRecord[] {
		const rows = this.db
			.prepare(
				`SELECT started_at, duration_sec, outcome, afk, viewers, deaths, revives,
					words_spawned, words_expired, max_enemies, kills, misses,
					heals, doomsday, avg_enemies, avg_hp_fraction
				FROM rounds WHERE broadcaster_id = ? ORDER BY id DESC LIMIT ?`,
			)
			.all(broadcasterId, limit) as unknown as RoundRow[];

		return rows.map(toRecord);
	}

	prune(broadcasterId: string): void {
		this.db
			.prepare(
				`DELETE FROM rounds WHERE broadcaster_id = ? AND id NOT IN (
					SELECT id FROM rounds WHERE broadcaster_id = ?
					ORDER BY id DESC LIMIT ?
				)`,
			)
			.run(broadcasterId, broadcasterId, ROUNDS_KEPT_PER_BROADCASTER);
	}
}
