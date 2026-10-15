import {
	ROUND_OUTCOME,
	type RoundOutcome,
} from "#lib/features/rounds/record.js";
import type { With } from "miniplex";
import { SESSIONPHASE, type Entity } from "../types.js";
import type { SystemFactory } from "./types.js";

const round2 = (value: number) => Math.round(value * 100) / 100;

export const createRoundLogSystem: SystemFactory = (ctx) => {
	const sessions = ctx.world.with("session");
	const words = ctx.world.with("word");
	const armed = ctx.world.with("armed");
	const viewers = ctx.world.with("viewer", "hp");

	let phase: string | null = null;
	let lastPhase: string | null = null;

	let startedAt = 0;
	let viewersAtStart = 0;
	let durationSec = 0;
	let samples = 0;
	let deaths = 0;
	let revives = 0;
	let wordsSpawned = 0;
	let wordsExpired = 0;
	let maxEnemies = 0;
	let hpSum = 0;
	let enemySum = 0;
	const wasDead = new Map<string, boolean>();
	const wasReturning = new Map<string, boolean>();

	const reset = () => {
		startedAt = ctx.now();
		viewersAtStart = viewers.size;
		durationSec = 0;
		samples = 0;
		deaths = 0;
		revives = 0;
		wordsSpawned = 0;
		wordsExpired = 0;
		maxEnemies = 0;
		hpSum = 0;
		enemySum = 0;
		wasDead.clear();
		wasReturning.clear();
	};

	const unsubscribeWord = words.onEntityAdded.subscribe(() => {
		if (phase === SESSIONPHASE.PLAYING) wordsSpawned++;
	});
	const unsubscribeArmed = armed.onEntityAdded.subscribe(() => {
		if (phase === SESSIONPHASE.PLAYING) wordsExpired++;
	});

	const countDeaths = () => {
		for (const viewer of viewers) {
			const dead = viewer.dead === true;
			if (dead && !(wasDead.get(viewer.viewer.userId) ?? false)) deaths++;
			wasDead.set(viewer.viewer.userId, dead);
		}
	};

	const countRevives = () => {
		for (const viewer of viewers) {
			const returning = viewer.respawning !== undefined;
			if (returning && !(wasReturning.get(viewer.viewer.userId) ?? false)) {
				revives++;
			}
			wasReturning.set(viewer.viewer.userId, returning);
		}
	};

	const finish = (entity: With<Entity, "session">) => {
		if (durationSec <= 0) return;

		countDeaths();
		countRevives();

		const outcome: RoundOutcome =
			viewers.size === 0 ? ROUND_OUTCOME.EMPTY : ROUND_OUTCOME.WIPE;
		const stats = entity.roundStats;
		const total = (table: Record<string, { count: number }> | undefined) =>
			table
				? Object.values(table).reduce((sum, entry) => sum + entry.count, 0)
				: 0;

		ctx.onRoundEnd?.({
			startedAt,
			durationSec: round2(durationSec),
			outcome,
			afk: entity.session.afk,
			viewers: viewersAtStart,
			deaths,
			revives,
			wordsSpawned,
			wordsExpired,
			maxEnemies,
			kills: total(stats?.kills),
			misses: total(stats?.misses),
			heals: total(stats?.heals),
			doomsday: total(stats?.doomsday),
			avgEnemies: samples > 0 ? round2(enemySum / samples) : 0,
			avgHpFraction:
				samples > 0 && viewersAtStart > 0
					? round2(hpSum / samples / viewersAtStart / ctx.settings.viewerBaseHp)
					: 0,
		});
	};

	const system = (dt: number) => {
		for (const entity of sessions) {
			phase = entity.session.phase;

			if (phase !== lastPhase) {
				if (lastPhase === SESSIONPHASE.PLAYING) finish(entity);
				if (phase === SESSIONPHASE.PLAYING) reset();
				lastPhase = phase;
			}

			if (phase !== SESSIONPHASE.PLAYING) continue;

			durationSec += dt;
			samples++;
			enemySum += words.size;
			maxEnemies = Math.max(maxEnemies, words.size);
			countDeaths();
			countRevives();

			let hp = 0;
			for (const viewer of viewers) {
				if (viewer.dead) continue;
				hp += viewer.hp.current;
			}

			hpSum += hp;
		}
	};

	system.dispose = () => {
		unsubscribeWord();
		unsubscribeArmed();
	};

	return system;
};
