export const Z_FAR = 1200;
export const Z_NEAR = 200;
export const FOCAL = Z_NEAR;

export const FONT_SIZE = 28;
export const VIEWER_LABEL_FONT_SIZE = 12;

export const WORD_TTL = 30;

export const MIN_FLY_SPEED = 500;
export const MAX_FLY_SPEED = 900;

export const ENEMY_SPAWN_MIN_INTERVAL = 2;
export const ENEMY_SPAWN_MAX_INTERVAL = 4;
export const MAX_ENEMIES = 30;

export const PRESSURE_SPAWN_SCALE_K = 1.2;
export const PRESSURE_SPAWN_MIN_INTERVAL = 0.05;
export const PRESSURE_MAX_ENEMIES_BASE = 4;
export const PRESSURE_MAX_ENEMIES_PER_PLAYER = 2;
export const PRESSURE_MAX_ENEMIES_CAP = 100;

export function pressureSpawnInterval(
	aliveViewers: number,
	k: number = PRESSURE_SPAWN_SCALE_K,
): {
	min: number;
	max: number;
} {
	const scale = 1 + k * Math.max(0, aliveViewers);
	return {
		min: Math.max(
			PRESSURE_SPAWN_MIN_INTERVAL,
			ENEMY_SPAWN_MIN_INTERVAL / scale,
		),
		max: Math.max(
			PRESSURE_SPAWN_MIN_INTERVAL * 2,
			ENEMY_SPAWN_MAX_INTERVAL / scale,
		),
	};
}

export function pressureMaxEnemies(aliveViewers: number): number {
	return Math.min(
		PRESSURE_MAX_ENEMIES_CAP,
		PRESSURE_MAX_ENEMIES_BASE +
			Math.round(PRESSURE_MAX_ENEMIES_PER_PLAYER * Math.max(0, aliveViewers)),
	);
}

export const VIEWER_WIDTH = 24;
export const VIEWER_HEIGHT = 32;
export const VIEWER_SCALE = 2;
export const VIEWER_GROUND_MARGIN = 16;
export const VIEWER_PLATE_PADDING = 6;
export const WALK_EDGE_MARGIN = 8;
export const VIEWER_BASE_HP = 10;
export const BATTERY_HEAL = 3;
export const BATTERY_MAX = 5;
export const REVIVE_MAX = 1;
export const REVIVE_DELAY = 20;
export const SHIELD_MAX_HP = 3;
export const SHIELD_REGEN_INTERVAL = 20;
export const WALK_MIN_SPEED = 20;
export const WALK_MAX_SPEED = 70;
export const WALK_MIN_TURN_TIME = 1;
export const WALK_MAX_TURN_TIME = 4;

export const VIEWER_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export const ENEMY_BOTTOM_MARGIN = 90;

export const BULLET_SPEED = 700;
export const BULLET_RADIUS = 4;
export const BULLET_HIT_DISTANCE = 30;

export const STAR_TTL = 0.8;
export const STAR_RISE = 40;
export const STAR_RADIUS = 10;
export const STAR_SPIN = Math.PI * 3;

export const EXPLOSION_FRAME_LABELS = ["f11", "f12", "g12", "g13"];
export const EXPLOSION_FRAME_DURATION = 0.08;
export const EXPLOSION_SCALE = 2;
export const BULLET_SCALE = 2;

export const ENEMY_SHOT_SPEED = 400;
export const ENEMY_SHOT_DAMAGE_CHANCE = 0.6;
export const RICOCHET_TTL = 0.6;
export const RICOCHET_SPEED_FACTOR = 2;
export const SPARK_COUNT = 5;
export const SPARK_TTL = 0.35;
export const SPARK_HIT_COUNT = 10;
export const SPARK_HIT_TTL = 0.5;
export const SPARK_SPEED = 180;
export const ENEMY_SHOT_HIT_DISTANCE = 20;

export const ARMED_FUSE_MS = 1000;

export const GAMEOVER_DURATION = 10;
export const RESPAWN_DURATION = 30;
export const SESSION_INTRO_DURATION = 9;
export const SESSION_ENEMY_GRACE = 1.5;
export const AFK_RESTART_DELAY = 30;
