import {
	BATTERY_HEAL,
	BATTERY_MAX,
	ENEMY_SHOT_DAMAGE_CHANCE,
	ENEMY_SPAWN_MAX_INTERVAL,
	ENEMY_SPAWN_MIN_INTERVAL,
	MAX_ENEMIES,
	RESPAWN_DURATION,
	SHIELD_MAX_HP,
	SHIELD_REGEN_INTERVAL,
	VIEWER_BASE_HP,
	WORD_TTL,
} from "../config.js";
import { WORDS } from "../words.js";

export interface SimParams {
	activePlayers: number;
	passivePlayers: number;
	durationSec: number;
	spawnMinInterval: number;
	spawnMaxInterval: number;
	spawnScaleK: number;
	maxEnemiesBase: number;
	maxEnemiesPerPlayer: number;
	wordTtl: number;
	viewerHp: number;
	respawnDuration: number;
	typingCharsPerSec: number;
	reactionSec: number;
	shieldUptime: number;
	shieldHp: number;
	shieldRegenInterval: number;
	shieldDurationSec: number;
	batteryGrantsPerHour: number;
	batteryHeal: number;
	batteryMax: number;
	batteryUseBelowHp: number;
	enemyDamageChance: number;
	fireIntervalSec: number;
}

export const DEFAULT_PARAMS: Omit<
	SimParams,
	"activePlayers" | "passivePlayers"
> = {
	durationSec: 600,
	spawnMinInterval: ENEMY_SPAWN_MIN_INTERVAL,
	spawnMaxInterval: ENEMY_SPAWN_MAX_INTERVAL,
	spawnScaleK: 0,
	maxEnemiesBase: MAX_ENEMIES,
	maxEnemiesPerPlayer: 0,
	wordTtl: WORD_TTL,
	viewerHp: VIEWER_BASE_HP,
	respawnDuration: RESPAWN_DURATION,
	typingCharsPerSec: 3.5,
	reactionSec: 1.5,
	shieldUptime: 0,
	shieldHp: SHIELD_MAX_HP,
	shieldRegenInterval: SHIELD_REGEN_INTERVAL,
	shieldDurationSec: 600,
	batteryGrantsPerHour: 0,
	batteryHeal: BATTERY_HEAL,
	batteryMax: BATTERY_MAX,
	batteryUseBelowHp: 4,
	enemyDamageChance: ENEMY_SHOT_DAMAGE_CHANCE,
	fireIntervalSec: 3,
};

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

interface SimWord {
	expiresAt: number;
	claimedBy: number;
	killAt?: number;
}

interface SimPlayer {
	active: boolean;
	hp: number;
	deadUntil: number;
	busyUntil: number;
	deaths: number;
	shieldHp: number;
	shieldUntil: number;
	nextShieldAt: number;
	shieldLastRegenAt: number;
	batteries: number;
	nextBatteryAt: number;
}

const DT = 0.1;

export function runSimulation(params: SimParams, seed: number): SimStats {
	const rng = mulberry32(seed);
	const n = params.activePlayers + params.passivePlayers;

	const spawnIntervalScale =
		1 + params.spawnScaleK * Math.max(0, params.activePlayers - 1);
	const maxEnemies = Math.round(
		params.maxEnemiesBase +
			params.maxEnemiesPerPlayer * Math.max(0, params.activePlayers - 1),
	);

	const shieldPeriod =
		params.shieldUptime > 0
			? params.shieldDurationSec / params.shieldUptime
			: Infinity;

	const batteryInterval =
		params.batteryGrantsPerHour > 0
			? 3600 / params.batteryGrantsPerHour
			: Infinity;

	const players: SimPlayer[] = Array.from({ length: n }, (_, i) => {
		const periodic = params.shieldUptime > 0 && params.shieldUptime < 1;
		const startsShielded = periodic && rng() < params.shieldUptime;
		return {
			active: i < params.activePlayers,
			hp: params.viewerHp,
			deadUntil: 0,
			busyUntil: 0,
			deaths: 0,
			shieldHp: params.shieldHp,
			shieldUntil:
				params.shieldUptime >= 1 || startsShielded
					? params.shieldDurationSec
					: 0,
			nextShieldAt: periodic
				? startsShielded
					? shieldPeriod
					: params.shieldDurationSec +
						rng() * (shieldPeriod - params.shieldDurationSec)
				: Infinity,
			shieldLastRegenAt: 0,
			batteries: 0,
			nextBatteryAt: rng() * batteryInterval,
		};
	});

	const words: SimWord[] = [];
	const armedQueue: number[] = [];
	let nextFireAt = 0;
	let nextSpawnAt =
		params.spawnMinInterval +
		rng() * (params.spawnMaxInterval - params.spawnMinInterval);
	let shotsFired = 0;
	let wordsSpawned = 0;
	let wordsKilled = 0;
	let hpSum = 0;
	let enemySum = 0;
	let steps = 0;

	const randomWordLength = () => WORDS[Math.floor(rng() * WORDS.length)].length;

	let wipeSec: number | null = null;

	for (let t = 0; t < params.durationSec; t += DT) {
		steps++;

		if (t >= nextSpawnAt && words.length < maxEnemies) {
			nextSpawnAt =
				t +
				(params.spawnMinInterval +
					rng() * (params.spawnMaxInterval - params.spawnMinInterval)) /
					spawnIntervalScale;
			words.push({ expiresAt: t + params.wordTtl, claimedBy: -1 });
			wordsSpawned++;
		}

		for (let i = words.length - 1; i >= 0; i--) {
			const word = words[i];
			if (word.expiresAt > t) continue;
			words.splice(i, 1);
			armedQueue.push(t);
		}

		if (t >= nextFireAt && armedQueue.length > 0) {
			armedQueue.shift();
			nextFireAt = t + params.fireIntervalSec;

			let alive = 0;
			for (const p of players) {
				if (p.deadUntil <= t) alive++;
			}
			if (alive > 0) {
				shotsFired++;
			}

			let roll = Math.floor(rng() * Math.max(1, alive));
			for (const p of players) {
				if (p.deadUntil > t) continue;
				if (roll > 0) {
					roll--;
					continue;
				}

				if (rng() >= params.enemyDamageChance) break;

				const damage = 1;

				if (t < p.shieldUntil && p.shieldHp > 0) {
					p.shieldHp = Math.max(0, p.shieldHp - damage);
					break;
				}

				p.hp -= damage;
				if (p.hp <= 0) {
					p.deaths++;
					p.deadUntil = t + params.respawnDuration;
					p.hp = 0;
					p.busyUntil = 0;
					const pi = players.indexOf(p);
					for (const w of words) {
						if (w.claimedBy === pi) {
							w.claimedBy = -1;
							w.killAt = undefined;
						}
					}
				}
				break;
			}
		}

		for (let pi = 0; pi < players.length; pi++) {
			const p = players[pi];

			if (p.deadUntil > 0 && p.deadUntil <= t) {
				p.deadUntil = 0;
				p.hp = params.viewerHp;
			}

			if (p.deadUntil > 0) {
				hpSum += 0;
				continue;
			}
			hpSum += p.hp;

			if (t >= p.nextShieldAt) {
				p.shieldHp = params.shieldHp;
				p.shieldUntil = t + params.shieldDurationSec;
				p.nextShieldAt = t + shieldPeriod;
			}

			if (t < p.shieldUntil && p.shieldHp < params.shieldHp) {
				if (t - p.shieldLastRegenAt >= params.shieldRegenInterval) {
					p.shieldHp += 1;
					p.shieldLastRegenAt = t;
				}
			} else {
				p.shieldLastRegenAt = t;
			}

			if (t >= p.nextBatteryAt) {
				if (p.batteries < params.batteryMax) p.batteries += 1;
				p.nextBatteryAt = t + batteryInterval;
			}

			if (p.batteries > 0 && p.hp > 0 && p.hp <= params.batteryUseBelowHp) {
				p.batteries -= 1;
				p.hp = Math.min(params.viewerHp, p.hp + params.batteryHeal);
			}

			if (!p.active || p.busyUntil > t) continue;

			let oldest = -1;
			for (let wi = 0; wi < words.length; wi++) {
				if (words[wi].claimedBy !== -1) continue;
				if (oldest === -1 || words[wi].expiresAt < words[oldest].expiresAt) {
					oldest = wi;
				}
			}
			if (oldest === -1) continue;

			words[oldest].claimedBy = pi;
			const typeTime = randomWordLength() / params.typingCharsPerSec;
			p.busyUntil = t + params.reactionSec + typeTime;
			words[oldest].killAt = p.busyUntil;
		}

		for (let i = words.length - 1; i >= 0; i--) {
			const word = words[i];
			if (word.killAt === undefined || word.killAt > t) continue;
			words.splice(i, 1);
			wordsKilled++;
		}

		enemySum += words.length + armedQueue.length;

		let aliveTotal = 0;
		for (const p of players) {
			if (p.deadUntil <= t) aliveTotal++;
		}
		if (aliveTotal === 0) {
			wipeSec = t;
			break;
		}
	}

	const deaths = players.reduce((sum, p) => sum + p.deaths, 0);
	const hours = params.durationSec / 3600;

	return {
		deaths,
		deathsPerHourPerPlayer: n > 0 && hours > 0 ? deaths / n / hours : 0,
		shotsFired,
		wordsSpawned,
		wordsKilled,
		expiredPct: wordsSpawned > 0 ? (shotsFired / wordsSpawned) * 100 : 0,
		avgHpFraction: steps > 0 && n > 0 ? hpSum / steps / n / params.viewerHp : 0,
		avgActiveEnemies: steps > 0 ? enemySum / steps : 0,
		wipeSec,
	};
}

export function averageStats(
	params: SimParams,
	runs: number,
	seedBase = 1,
): SimStats {
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
		const stats = runSimulation(params, seedBase + i);
		acc.deaths += stats.deaths;
		acc.deathsPerHourPerPlayer += stats.deathsPerHourPerPlayer;
		acc.shotsFired += stats.shotsFired;
		acc.wordsSpawned += stats.wordsSpawned;
		acc.wordsKilled += stats.wordsKilled;
		acc.expiredPct += stats.expiredPct;
		acc.avgHpFraction += stats.avgHpFraction;
		acc.avgActiveEnemies += stats.avgActiveEnemies;
		acc.wipeSec! += stats.wipeSec ?? params.durationSec;
	}

	for (const key of Object.keys(acc) as (keyof SimStats)[]) {
		acc[key]! /= runs;
	}
	return acc;
}
