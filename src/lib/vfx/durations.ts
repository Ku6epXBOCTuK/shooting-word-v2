import type { ReactionKind } from "./kinds.js";

export const EXPLOSION_FRAME_LABELS = ["f11", "f12", "g12", "g13"];
export const EXPLOSION_FRAME_DURATION = 0.08;
export const EXPLOSION_SCALE = 2;

export const SPARK_COUNT = 5;
export const SPARK_HIT_COUNT = 10;
export const SPARK_HIT_TTL = 0.5;
export const SPARK_SPEED = 180;

export const RICOCHET_TTL = 0.6;
export const STAR_TTL = 0.8;

export const EXPLOSION_DURATION =
	EXPLOSION_FRAME_LABELS.length * EXPLOSION_FRAME_DURATION;

const DEVICE_SPARK_TTL = 1;
const FLARE_TTL = 0.9;

export const REACTION_DURATION: Record<ReactionKind, number> = {
	"ship-hit": SPARK_HIT_TTL,
	"ship-ricochet": RICOCHET_TTL,
	"word-destroyed": EXPLOSION_DURATION,
	"bullet-miss": EXPLOSION_DURATION,
	"viewer-destroyed": EXPLOSION_DURATION,
	"word-kill-mark": STAR_TTL,
	"device-spark": DEVICE_SPARK_TTL,
	doomsday: FLARE_TTL,
	timestop: FLARE_TTL,
	reward: FLARE_TTL,
};

export const SHIELD_HIT_DECAY_MS = 450;

export interface ShieldHit {
	hit: number;
	hitDir: { x: number; y: number };
}

export interface ShieldHitMark {
	hitAt?: number;
	hitFrom?: { x: number; y: number };
}

// NOTE: the aura has no clock of its own, so the whole hit decay is computed
// here and the aura receives finished numbers.
export function shieldHit(
	mark: ShieldHitMark,
	at: { x: number; y: number },
	now: number,
): ShieldHit {
	const age = mark.hitAt === undefined ? Infinity : now - mark.hitAt;
	const dx = at.x - (mark.hitFrom?.x ?? at.x);
	const dy = at.y - (mark.hitFrom?.y ?? at.y);
	const length = Math.hypot(dx, dy);
	if (!Number.isFinite(age) || length < 1e-6) {
		return {
			hit: Math.max(0, 1 - age / SHIELD_HIT_DECAY_MS),
			hitDir: { x: 0, y: 1 },
		};
	}
	return {
		hit: Math.max(0, 1 - age / SHIELD_HIT_DECAY_MS),
		hitDir: { x: dx / length, y: dy / length },
	};
}
