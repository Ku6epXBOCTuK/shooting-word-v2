import { SHIELD_DURATION_MS } from "#lib/features/rewards/config.js";
import type { With } from "miniplex";
import { createHeadlessGame } from "../headless.js";
import { defaultSettings, type GameSettings } from "../settings.js";
import { SESSIONPHASE, type Entity } from "../types.js";

type ViewerEntity = With<Entity, "viewer" | "hp">;
type WordEntity = With<Entity, "word" | "lifetime">;

export interface SimStats {
	deaths: number;
	deathsPerHourPerPlayer: number;
	shotsFired: number;
	wordsSpawned: number;
	wordsKilled: number;
	expiredPct: number;
	avgHpFraction: number;
	avgActiveEnemies: number;
	wipeSec: number | null;
}

export interface SimParams {
	activePlayers: number;
	passivePlayers: number;
	durationSec: number;
	typingCharsPerSec: number;
	reactionSec: number;
	shieldUptime: number;
	shieldDurationSec: number;
	batteryGrantsPerHour: number;
	batteryUseBelowHp: number;
	settings?: Partial<GameSettings>;
	seed: number;
}

export const DEFAULT_PARAMS = {
	durationSec: 600,
	typingCharsPerSec: 3.5,
	reactionSec: 1.5,
	shieldUptime: 0,
	shieldDurationSec: SHIELD_DURATION_MS / 1000,
	batteryGrantsPerHour: 0,
	batteryUseBelowHp: 4,
};

export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const DT = 0.1;

type Game = ReturnType<typeof createHeadlessGame>;
type ViewersById = Map<string, ViewerEntity>;
type Claims = Map<string, { entity: WordEntity; fireAt: number }>;

interface Bot {
	userId: string;
	active: boolean;
	nextShieldAt: number;
	nextBatteryAt: number;
}

function createBots(params: SimParams, rng: () => number): Bot[] {
	const n = params.activePlayers + params.passivePlayers;
	const shieldPeriod =
		params.shieldUptime > 0
			? params.shieldDurationSec / params.shieldUptime
			: Infinity;
	const batteryInterval =
		params.batteryGrantsPerHour > 0
			? 3600 / params.batteryGrantsPerHour
			: Infinity;

	const bots = Array.from({ length: n }, (_, i) => ({
		userId: `bot${i}`,
		active: i < params.activePlayers,
		nextShieldAt: Infinity,
		nextBatteryAt: Infinity,
	}));

	for (const bot of bots) {
		if (params.shieldUptime <= 0) continue;
		bot.nextShieldAt =
			params.shieldUptime >= 1
				? 0
				: rng() < params.shieldUptime
					? 0
					: rng() * shieldPeriod;
	}
	for (const bot of bots) {
		bot.nextBatteryAt = rng() * batteryInterval;
	}

	return bots;
}

function tickBuffs(
	game: Game,
	bots: Bot[],
	viewerById: ViewersById,
	params: SimParams,
	t: number,
	nowMs: number,
): void {
	const shieldPeriod =
		params.shieldUptime > 0
			? params.shieldDurationSec / params.shieldUptime
			: Infinity;
	const batteryInterval =
		params.batteryGrantsPerHour > 0
			? 3600 / params.batteryGrantsPerHour
			: Infinity;

	for (const bot of bots) {
		const viewer = viewerById.get(bot.userId);
		if (!viewer) continue;

		if (t >= bot.nextShieldAt) {
			bot.nextShieldAt = t + shieldPeriod;
			game.applyShields([
				{
					userId: bot.userId,
					expiresAt: nowMs + params.shieldDurationSec * 1000,
				},
			]);
		}

		if (t >= bot.nextBatteryAt) {
			bot.nextBatteryAt = t + batteryInterval;
			game.grantBatteries([bot.userId]);
		}

		if (
			!viewer.dead &&
			(viewer.batteries ?? 0) > 0 &&
			viewer.hp.current <= params.batteryUseBelowHp &&
			viewer.hp.current < viewer.hp.max
		) {
			game.repair(bot.userId);
		}
	}
}

function releaseStaleClaims(
	game: Game,
	claims: Claims,
	viewerById: ViewersById,
): void {
	for (const [userId, claim] of claims) {
		const viewer = viewerById.get(userId);
		if (!game.world.has(claim.entity) || !viewer || viewer.dead) {
			claims.delete(userId);
		}
	}
}

function claimWords(
	game: Game,
	bots: Bot[],
	claims: Claims,
	viewerById: ViewersById,
	params: SimParams,
	t: number,
): void {
	for (const bot of bots) {
		if (!bot.active || claims.has(bot.userId)) continue;
		const viewer = viewerById.get(bot.userId);
		if (!viewer || viewer.dead) continue;

		let oldest: WordEntity | null = null;
		let oldestRemaining = Infinity;
		for (const entity of game.world
			.with("word", "lifetime")
			.without("armed")
			.without("timedOut")) {
			if ([...claims.values()].some((c) => c.entity === entity)) continue;
			const remaining = entity.lifetime.ttl - entity.lifetime.age;
			if (remaining < oldestRemaining) {
				oldestRemaining = remaining;
				oldest = entity;
			}
		}
		if (!oldest) continue;

		const typeTime = oldest.word.text.length / params.typingCharsPerSec;
		claims.set(bot.userId, {
			entity: oldest,
			fireAt: t + params.reactionSec + typeTime,
		});
	}
}

function fireDueShots(
	game: Game,
	claims: Claims,
	viewerById: ViewersById,
	t: number,
): void {
	for (const [userId, claim] of [...claims]) {
		if (t < claim.fireAt) continue;
		claims.delete(userId);
		const viewer = viewerById.get(userId);
		if (!viewer || viewer.dead || !game.world.has(claim.entity)) continue;
		game.shoot({
			channel: "sim",
			userId,
			user: viewer.viewer.user,
			text: claim.entity.word.text,
			isMod: false,
		});
	}
}

export async function runSimulation(params: SimParams): Promise<SimStats> {
	const rng = mulberry32(params.seed);
	let nowMs = 0;

	const settings: GameSettings = defaultSettings();
	Object.assign(settings, params.settings ?? {});
	const game = createHeadlessGame({
		settings,
		rng,
		now: () => nowMs,
	});

	const bots = createBots(params, rng);
	for (const bot of bots) {
		game.joinViewer({ userId: bot.userId, user: bot.userId });
	}
	game.startGame();

	let wordsSpawned = 0;
	let wordsArmed = 0;
	let shotsFired = 0;
	game.world.with("word").onEntityAdded.subscribe(() => wordsSpawned++);
	game.world.with("armed").onEntityAdded.subscribe(() => wordsArmed++);
	game.world.with("enemyShot").onEntityAdded.subscribe(() => shotsFired++);

	const claims: Claims = new Map();
	const prevDead = new Map<string, boolean>();
	let deaths = 0;
	let hpSum = 0;
	let enemySum = 0;
	let steps = 0;
	let wipeSec: number | null = null;

	let stepCount = 0;
	for (let t = 0; t < params.durationSec; t += DT) {
		nowMs += DT * 1000;
		// viewerStore.save() ставит микрозадачи на каждый dirty-тик; синхронный
		// цикл не даёт им выполниться, и они копятся, удерживая контексты (OOM на
		// калибровке). Периодически даём очереди дренироваться.
		if (++stepCount % 100 === 0) await Promise.resolve();

		const viewerById: ViewersById = new Map();
		for (const entity of game.world.with("viewer", "hp")) {
			viewerById.set(entity.viewer.userId, entity);
		}

		tickBuffs(game, bots, viewerById, params, t, nowMs);
		releaseStaleClaims(game, claims, viewerById);
		claimWords(game, bots, claims, viewerById, params, t);
		fireDueShots(game, claims, viewerById, t);

		game.step(DT);

		const session = [...game.world.with("session")][0];
		const phase = session?.session.phase;
		if (phase === SESSIONPHASE.GAMEOVER) break;
		if (phase !== SESSIONPHASE.PLAYING) continue;

		steps++;

		let hpStep = 0;
		let alive = 0;
		for (const entity of game.world.with("viewer", "hp")) {
			const userId = entity.viewer.userId;
			const dead = entity.dead === true;
			const was = prevDead.get(userId) ?? false;
			if (dead && !was) deaths++;
			prevDead.set(userId, dead);
			if (!dead) {
				alive++;
				hpStep += entity.hp.current;
			}
		}
		hpSum += hpStep;
		enemySum += game.world.with("word").size;

		if (alive === 0) {
			wipeSec = t;
			break;
		}
	}

	game.dispose();

	const hours = params.durationSec / 3600;
	const viewerHp = settings.viewerBaseHp;

	return {
		deaths,
		deathsPerHourPerPlayer:
			bots.length > 0 && hours > 0 ? deaths / bots.length / hours : 0,
		shotsFired,
		wordsSpawned,
		wordsKilled: Math.max(0, wordsSpawned - wordsArmed),
		expiredPct: wordsSpawned > 0 ? (wordsArmed / wordsSpawned) * 100 : 0,
		avgHpFraction:
			steps > 0 && bots.length > 0 ? hpSum / steps / bots.length / viewerHp : 0,
		avgActiveEnemies: steps > 0 ? enemySum / steps : 0,
		wipeSec,
	};
}

export async function averageStats(
	base: Omit<SimParams, "seed">,
	runs: number,
	seedBase = 1,
): Promise<SimStats> {
	const acc: SimStats = {
		deaths: 0,
		deathsPerHourPerPlayer: 0,
		shotsFired: 0,
		wordsSpawned: 0,
		wordsKilled: 0,
		expiredPct: 0,
		avgHpFraction: 0,
		avgActiveEnemies: 0,
		wipeSec: 0,
	};

	for (let i = 0; i < runs; i++) {
		const stats = await runSimulation({ ...base, seed: seedBase + i });
		acc.deaths += stats.deaths;
		acc.deathsPerHourPerPlayer += stats.deathsPerHourPerPlayer;
		acc.shotsFired += stats.shotsFired;
		acc.wordsSpawned += stats.wordsSpawned;
		acc.wordsKilled += stats.wordsKilled;
		acc.expiredPct += stats.expiredPct;
		acc.avgHpFraction += stats.avgHpFraction;
		acc.avgActiveEnemies += stats.avgActiveEnemies;
		acc.wipeSec! += stats.wipeSec ?? base.durationSec;
	}

	for (const key of Object.keys(acc) as (keyof SimStats)[]) {
		acc[key]! /= runs;
	}
	return acc;
}
