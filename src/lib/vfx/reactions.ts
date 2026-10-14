import { BULLET_SCALE, ENEMY_SHOT_SPEED } from "#lib/game/config.ts";
import {
	EXPLOSION_FRAME_DURATION,
	EXPLOSION_SCALE,
	REACTION_DURATION,
	RICOCHET_TTL,
	SPARK_COUNT,
	SPARK_HIT_COUNT,
	SPARK_SPEED,
	STAR_TTL,
} from "#lib/vfx/durations.js";
import { Container, Graphics, Sprite } from "pixi.js";
import type { ReactionKind } from "./kinds.js";
import type { VfxFrame, VfxOptions, VfxReaction } from "./types.js";

const SPARK_RADIUS = 2;
const SPARK_COLOR = 0xffdd66;

const RICOCHET_SPEED_FACTOR = 2;
const RICOCHET_SPREAD = Math.PI / 2;
const RICOCHET_BASE_ANGLE = -Math.PI / 4;

const STAR_RISE = 40;
const STAR_RADIUS = 10;
const STAR_SPIN = Math.PI * 3;

const DEVICE_SPARK_RADIUS = 4;
const DEVICE_SPARK_SPEED_MIN = 200;
const DEVICE_SPARK_INTRO_MIN = 400;
const DEVICE_SPARK_INTRO_SPREAD = 600;

const FLARE_RINGS = 3;
const FLARE_MAX_RADIUS = 64;
const FLARE_WIDTH = 3;
const DEFAULT_FLARE_COLOR = 0xffffff;

/** Отсчёт собственного времени внутри эффекта: первый кадр — ноль. */
function clock() {
	let start = -1;
	return (frame: VfxFrame) => {
		if (start < 0) start = frame.t;
		return frame.t - start;
	};
}

const easeOutCubic = (k: number) => 1 - Math.pow(1 - k, 3);

type Effect = (options: VfxOptions) => VfxReaction;

interface SparkSpec {
	count: number;
	radius: number;
	kind: ReactionKind;
	speed: (options: VfxOptions) => number;
}

function createSparks(spec: SparkSpec): Effect {
	const duration = REACTION_DURATION[spec.kind];

	return (options) => {
		const { x, y, rng } = options;
		const body = new Graphics();
		const root = new Container();
		root.addChild(body);

		const baseSpeed = spec.speed(options);
		const parts = Array.from({ length: spec.count }, () => {
			const angle = rng() * Math.PI * 2;
			const speed = baseSpeed * (0.5 + rng() * 0.5);
			return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
		});

		const elapsed = clock();

		return {
			root,
			duration,
			update(frame) {
				const age = elapsed(frame);
				const alpha = 1 - Math.min(1, age / duration);
				body.clear();
				for (const part of parts) {
					body
						.circle(x + part.vx * age, y + part.vy * age, spec.radius)
						.fill({ color: SPARK_COLOR, alpha });
				}
			},
			destroy() {
				root.destroy();
			},
		};
	};
}

/** Взрыв кадрами. Сколько именно кадров — решают ассеты. */
const createExplosion: Effect = (options) => {
	const frames = options.frames ?? [];
	const sprite = new Sprite(frames[0]);
	const root = new Container();
	root.addChild(sprite);
	sprite.anchor.set(0.5);
	sprite.scale.set(EXPLOSION_SCALE);

	const elapsed = clock();

	return {
		root,
		duration: REACTION_DURATION["word-destroyed"],
		update(frame) {
			const index = Math.min(
				frames.length - 1,
				Math.floor(elapsed(frame) / EXPLOSION_FRAME_DURATION),
			);
			if (frames[index]) sprite.texture = frames[index];
			sprite.x = frame.x;
			sprite.y = frame.y;
		},
		destroy() {
			root.destroy();
		},
	};
};

/** Звезда над кораблём стрелка: «ты попал». */
const createKillMark: Effect = () => {
	const body = new Graphics()
		.star(0, 0, 5, STAR_RADIUS, STAR_RADIUS * 0.45)
		.fill("#ffd700");
	const root = new Container();
	root.addChild(body);
	const elapsed = clock();

	return {
		root,
		duration: STAR_TTL,
		update(frame) {
			const k = Math.min(1, elapsed(frame) / STAR_TTL);
			body.x = frame.x;
			body.y = frame.y - easeOutCubic(k) * STAR_RISE;
			body.rotation = k * STAR_SPIN;
			body.alpha = 1 - k * k;
		},
		destroy() {
			root.destroy();
		},
	};
};

/** Промах: искры по месту попадания плюс улетающая рикошет-пуля. */
const createShipRicochet: Effect = (options) => {
	const sparks = createSparks({
		count: SPARK_COUNT,
		radius: SPARK_RADIUS,
		kind: "ship-ricochet",
		speed: () => SPARK_SPEED,
	})(options);

	const sprite = new Sprite(options.bullet);
	sprite.anchor.set(0.5);
	const root = new Container();
	root.addChild(sparks.root, sprite);

	const angle = RICOCHET_BASE_ANGLE - options.rng() * RICOCHET_SPREAD;
	const speed = ENEMY_SHOT_SPEED * RICOCHET_SPEED_FACTOR;
	const vx = Math.cos(angle) * speed;
	const vy = Math.sin(angle) * speed;
	const elapsed = clock();

	return {
		root,
		duration: RICOCHET_TTL,
		update(frame) {
			sparks.update(frame);
			const age = elapsed(frame);
			sprite.x = frame.x + vx * age;
			sprite.y = frame.y + vy * age;
			sprite.rotation = Math.atan2(vy, vx);
			sprite.scale.set(BULLET_SCALE * (1 - Math.min(1, age / RICOCHET_TTL)));
		},
		destroy() {
			root.destroy();
		},
	};
};

/** Расходящаяся вспышка: заряд устройства, остановка времени, награда. */
function createFlare(color: number, kind: ReactionKind): Effect {
	const duration = REACTION_DURATION[kind];

	return ({ x, y }) => {
		const body = new Graphics();
		const root = new Container();
		root.addChild(body);
		const elapsed = clock();

		return {
			root,
			duration,
			update(frame) {
				const k = Math.min(1, elapsed(frame) / duration);
				const radius = FLARE_MAX_RADIUS * easeOutCubic(k);
				body.clear();
				for (let i = FLARE_RINGS; i >= 1; i--) {
					body
						.circle(x, y, radius * (i / FLARE_RINGS))
						.stroke({ color, alpha: (1 - k) * (0.8 / i), width: FLARE_WIDTH });
				}
			},
			destroy() {
				root.destroy();
			},
		};
	};
}

const REACTIONS: Record<ReactionKind, Effect> = {
	"ship-hit": createSparks({
		count: SPARK_HIT_COUNT,
		radius: SPARK_RADIUS,
		kind: "ship-hit",
		speed: () => SPARK_SPEED,
	}),
	"ship-ricochet": createShipRicochet,
	"word-destroyed": createExplosion,
	"bullet-miss": createExplosion,
	"viewer-destroyed": createExplosion,
	"word-kill-mark": createKillMark,
	"device-spark": createSparks({
		count: 1,
		radius: DEVICE_SPARK_RADIUS,
		kind: "device-spark",
		speed: ({ value }) =>
			value && value > 0
				? DEVICE_SPARK_INTRO_MIN + DEVICE_SPARK_INTRO_SPREAD * value
				: DEVICE_SPARK_SPEED_MIN,
	}),
	doomsday: createFlare(0xff3322, "doomsday"),
	timestop: createFlare(0x66ccff, "timestop"),
	reward: (options) =>
		createFlare(options.value ?? DEFAULT_FLARE_COLOR, "reward")(options),
};

export function createReactionOf(
	kind: ReactionKind,
	options: VfxOptions,
): VfxReaction {
	return REACTIONS[kind](options);
}
