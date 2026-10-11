import { describe, expect, it } from "vitest";
import {
	ROUND_OUTCOME,
	type RoundRecord,
} from "#lib/features/rounds/record.js";
import { createHeadlessGame } from "./headless.js";
import { defaultSettings } from "./settings.js";
import { SESSIONPHASE } from "./types.js";

const DT = 0.1;
const MAX_STEPS = 20_000;
const START_MS = 1_700_000_000_000;

let now = START_MS;

function seededRng(seed: number) {
	let state = seed;
	return () => {
		state = (state * 1103515245 + 12345) % 2147483648;
		return state / 2147483648;
	};
}

function lethalSettings() {
	const settings = defaultSettings();
	settings.viewerBaseHp = 1;
	settings.enemyDamageChance = 1;
	settings.wordTtl = 5;
	settings.viewerMisses = false;
	return settings;
}

function phaseOf(game: ReturnType<typeof createHeadlessGame>) {
	return [...game.world.with("session")][0].session.phase;
}

function runUntil(game: ReturnType<typeof createHeadlessGame>, phase: string) {
	for (let i = 0; i < MAX_STEPS; i++) {
		now += DT * 1000;
		game.step(DT);
		if (phaseOf(game) === phase) return i;
	}
	throw new Error(`phase ${phase} not reached`);
}

function stepUntil(
	game: ReturnType<typeof createHeadlessGame>,
	done: () => boolean,
) {
	for (let i = 0; i < MAX_STEPS; i++) {
		if (done()) return i;
		now += DT * 1000;
		game.step(DT);
	}
	throw new Error("condition not reached");
}

describe("round log", () => {
	it("reports a wiped round once", () => {
		now = START_MS;
		const records: RoundRecord[] = [];
		const game = createHeadlessGame({
			settings: lethalSettings(),
			rng: seededRng(42),
			now: () => now,
			onRoundEnd: (record) => records.push(record),
		});

		game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		game.startGame();
		runUntil(game, SESSIONPHASE.GAMEOVER);

		expect(records).toHaveLength(1);
		expect(records[0]).toMatchObject({
			outcome: ROUND_OUTCOME.WIPE,
			afk: false,
			viewers: 1,
			deaths: 1,
			revives: 0,
		});
		expect(records[0].durationSec).toBeGreaterThan(0);
		expect(records[0].startedAt).toBeGreaterThan(START_MS);
		expect(records[0].wordsSpawned).toBeGreaterThan(0);
		expect(records[0].maxEnemies).toBeGreaterThan(0);
		expect(records[0].maxEnemies).toBeGreaterThanOrEqual(records[0].avgEnemies);
		expect(records[0].avgHpFraction).toBeGreaterThanOrEqual(0);
		expect(records[0].avgHpFraction).toBeLessThanOrEqual(1);

		game.dispose();
	});

	it("reports an empty room when every viewer timed out", () => {
		now = START_MS;
		const records: RoundRecord[] = [];
		const game = createHeadlessGame({
			settings: lethalSettings(),
			rng: seededRng(7),
			now: () => now,
			onRoundEnd: (record) => records.push(record),
		});

		game.startGame();
		runUntil(game, SESSIONPHASE.GAMEOVER);

		expect(records).toHaveLength(1);
		expect(records[0].outcome).toBe(ROUND_OUTCOME.EMPTY);
		expect(records[0].viewers).toBe(0);

		game.dispose();
	});

	it("counts nothing while the session is idle", () => {
		now = START_MS;
		const records: RoundRecord[] = [];
		const game = createHeadlessGame({
			settings: lethalSettings(),
			rng: seededRng(3),
			now: () => now,
			onRoundEnd: (record) => records.push(record),
		});

		game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		for (let i = 0; i < 500; i++) {
			now += DT * 1000;
			game.step(DT);
		}

		expect(records).toEqual([]);

		game.dispose();
	});

	it("counts a used revive token as an extra destruction", () => {
		now = START_MS;
		const records: RoundRecord[] = [];
		const game = createHeadlessGame({
			settings: lethalSettings(),
			rng: seededRng(5),
			now: () => now,
			onRoundEnd: (record) => records.push(record),
		});

		game.joinViewer({ userId: "u1", user: "u1", login: "u1" });
		game.joinViewer({ userId: "u2", user: "u2", login: "u2" });
		const entities = [...game.world.with("viewer", "hp")];
		const [fragile, tank] = entities;
		// второй держит раунд живым, пока первый ждёт возврата
		if (!tank?.hp || !fragile?.hp) throw new Error("viewers missing");
		tank.hp.max = 10_000;
		tank.hp.current = 10_000;

		game.grantRevives(["u1"]);
		game.startGame();

		stepUntil(game, () => fragile.dead === true);
		stepUntil(game, () => fragile.respawning !== undefined);
		stepUntil(game, () => fragile.dead === undefined);

		tank.hp.current = 1;
		runUntil(game, SESSIONPHASE.GAMEOVER);

		expect(records).toHaveLength(1);
		expect(records[0].revives).toBe(1);
		expect(records[0].deaths).toBe(3);
		expect(records[0].deaths).toBe(records[0].revives + records[0].viewers);

		game.dispose();
	});

	it("starts every round from zero", () => {
		now = START_MS;
		const records: RoundRecord[] = [];
		const game = createHeadlessGame({
			settings: lethalSettings(),
			rng: seededRng(11),
			now: () => now,
			onRoundEnd: (record) => records.push(record),
		});

		game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		game.startGame();
		runUntil(game, SESSIONPHASE.GAMEOVER);
		runUntil(game, SESSIONPHASE.IDLE);
		game.startGame();
		runUntil(game, SESSIONPHASE.GAMEOVER);

		expect(records).toHaveLength(2);
		expect(records[1].deaths).toBe(1);
		expect(records[1].revives).toBe(0);
		expect(records[1].startedAt).toBeGreaterThan(records[0].startedAt);
		expect(records[1].durationSec).toBeLessThanOrEqual(records[0].durationSec);

		game.dispose();
	});
});
