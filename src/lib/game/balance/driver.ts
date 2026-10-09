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

export interface DriverParams {
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

export const DEFAULT_DRIVER_PARAMS = {
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

export function runDriver(params: DriverParams): SimStats {
	const rng = mulberry32(params.seed);
	let nowMs = 0;

	const settings: GameSettings = defaultSettings();
	Object.assign(settings, params.settings ?? {});
	const game = createHeadlessGame({
		settings,
		rng,
		now: () => nowMs,
	});

	const n = params.activePlayers + params.passivePlayers;
	const userIds = Array.from({ length: n }, (_, i) => `bot${i}`);
	for (const userId of userIds) {
		game.joinViewer({ userId, user: userId });
	}
	game.startGame();

	let wordsSpawned = 0;
	let wordsArmed = 0;
	let shotsFired = 0;
	game.world.with("word").onEntityAdded.subscribe(() => wordsSpawned++);
	game.world.with("armed").onEntityAdded.subscribe(() => wordsArmed++);
	game.world.with("enemyShot").onEntityAdded.subscribe(() => shotsFired++);

	const shieldPeriod =
		params.shieldUptime > 0
			? params.shieldDurationSec / params.shieldUptime
			: Infinity;
	const batteryInterval =
		params.batteryGrantsPerHour > 0
			? 3600 / params.batteryGrantsPerHour
			: Infinity;

	const nextShieldAt = userIds.map(() => {
		if (params.shieldUptime <= 0) return Infinity;
		if (params.shieldUptime >= 1) return 0;
		return rng() < params.shieldUptime ? 0 : rng() * shieldPeriod;
	});
	const nextBatteryAt = userIds.map(() => rng() * batteryInterval);

	const claims = new Map<string, { entity: WordEntity; fireAt: number }>();
	const prevDead = new Map<string, boolean>();
	let deaths = 0;
	let hpSum = 0;
	let enemySum = 0;
	let steps = 0;
	let wipeSec: number | null = null;

	for (let t = 0; t < params.durationSec; t += DT) {
		nowMs += DT * 1000;

		const viewerById = new Map<string, ViewerEntity>();
		for (const entity of game.world.with("viewer", "hp")) {
			viewerById.set(entity.viewer.userId, entity);
		}

		for (const [i, userId] of userIds.entries()) {
			const viewer = viewerById.get(userId);
			if (!viewer) continue;

			if (t >= nextShieldAt[i]) {
				nextShieldAt[i] = t + shieldPeriod;
				game.applyShields([
					{ userId, expiresAt: nowMs + params.shieldDurationSec * 1000 },
				]);
			}

			if (t >= nextBatteryAt[i]) {
				nextBatteryAt[i] = t + batteryInterval;
				game.grantBatteries([userId]);
			}

			if (
				!viewer.dead &&
				(viewer.batteries ?? 0) > 0 &&
				viewer.hp.current <= params.batteryUseBelowHp &&
				viewer.hp.current < viewer.hp.max
			) {
				game.repair(userId);
			}
		}

		for (const [userId, claim] of claims) {
			const viewer = viewerById.get(userId);
			if (!game.world.has(claim.entity) || !viewer || viewer.dead) {
				claims.delete(userId);
			}
		}

		for (const [i, userId] of userIds.entries()) {
			if (i >= params.activePlayers) continue;
			if (claims.has(userId)) continue;
			const viewer = viewerById.get(userId);
			if (!viewer || viewer.dead) continue;

			let oldest: WordEntity | null = null;
			let oldestRemaining = Infinity;
			for (const entity of game.world.with("word", "lifetime")) {
				if ([...claims.values()].some((c) => c.entity === entity)) continue;
				const remaining = entity.lifetime.ttl - entity.lifetime.age;
				if (remaining < oldestRemaining) {
					oldestRemaining = remaining;
					oldest = entity;
				}
			}
			if (!oldest) continue;

			const typeTime = oldest.word.text.length / params.typingCharsPerSec;
			claims.set(userId, {
				entity: oldest,
				fireAt: t + params.reactionSec + typeTime,
			});
		}

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
		deathsPerHourPerPlayer: n > 0 && hours > 0 ? deaths / n / hours : 0,
		shotsFired,
		wordsSpawned,
		wordsKilled: Math.max(0, wordsSpawned - wordsArmed),
		expiredPct: wordsSpawned > 0 ? (wordsArmed / wordsSpawned) * 100 : 0,
		avgHpFraction: steps > 0 && n > 0 ? hpSum / steps / n / viewerHp : 0,
		avgActiveEnemies: steps > 0 ? enemySum / steps : 0,
		wipeSec,
	};
}
