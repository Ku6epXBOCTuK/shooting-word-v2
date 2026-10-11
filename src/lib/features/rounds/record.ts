export const ROUND_OUTCOME = {
	WIPE: "wipe",
	EMPTY: "empty",
} as const;

export type RoundOutcome = (typeof ROUND_OUTCOME)[keyof typeof ROUND_OUTCOME];

export interface RoundRecord {
	startedAt: number;
	durationSec: number;
	outcome: RoundOutcome;
	afk: boolean;
	viewers: number;
	deaths: number;
	revives: number;
	wordsSpawned: number;
	wordsExpired: number;
	maxEnemies: number;
	kills: number;
	misses: number;
	heals: number;
	doomsday: number;
	avgEnemies: number;
	avgHpFraction: number;
}

const OUTCOMES: readonly string[] = Object.values(ROUND_OUTCOME);

const COUNTERS = [
	"durationSec",
	"viewers",
	"deaths",
	"revives",
	"wordsSpawned",
	"wordsExpired",
	"maxEnemies",
	"kills",
	"misses",
	"heals",
	"doomsday",
	"avgEnemies",
	"avgHpFraction",
] as const;

const isCount = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value) && value >= 0;

export function isRoundRecord(value: unknown): value is RoundRecord {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}

	const record = value as Record<string, unknown>;

	if (!isCount(record.startedAt)) return false;
	if (!OUTCOMES.includes(record.outcome as string)) return false;
	if (typeof record.afk !== "boolean") return false;

	return COUNTERS.every((key) => isCount(record[key]));
}
