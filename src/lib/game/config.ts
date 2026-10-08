export const Z_FAR = 1200;
export const Z_NEAR = 200;
export const FOCAL = Z_NEAR;

export const FONT_SIZE = 28;

export const WORD_TTL = 30;
export const WORD_FADE_OUT = 0.5;

export const MIN_FLY_SPEED = 500;
export const MAX_FLY_SPEED = 900;

export const ENEMY_SPAWN_MIN_INTERVAL = 2;
export const ENEMY_SPAWN_MAX_INTERVAL = 4;
export const MAX_ENEMIES = 30;

export const ACTIVE_SPAWN_INTERVAL_BASE = 1.95;
export const ACTIVE_SPAWN_INTERVAL_PER_PLAYER = 7.0;
export const ACTIVE_SPAWN_INTERVAL_WIDTH = 0.75;
export const ACTIVE_MAX_ENEMIES_PER_PLAYER = 5;

export function activeSpawnInterval(totalViewers: number): {
	min: number;
	max: number;
} {
	const center =
		ACTIVE_SPAWN_INTERVAL_BASE +
		ACTIVE_SPAWN_INTERVAL_PER_PLAYER / Math.max(1, totalViewers);
	return {
		min: Math.max(0.5, center - ACTIVE_SPAWN_INTERVAL_WIDTH),
		max: center + ACTIVE_SPAWN_INTERVAL_WIDTH,
	};
}

export function activeMaxEnemies(totalViewers: number): number {
	return Math.round(Math.max(1, totalViewers) * ACTIVE_MAX_ENEMIES_PER_PLAYER);
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
export const SHIELD_MAX_HP = 3;
export const SHIELD_REGEN_INTERVAL = 20;
export const WALK_MIN_SPEED = 20;
export const WALK_MAX_SPEED = 70;
export const WALK_MIN_TURN_TIME = 1;
export const WALK_MAX_TURN_TIME = 4;

export const VIEWER_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export const ENEMY_BOTTOM_MARGIN = 90;

export const BULLET_SPEED = 700;
export const BULLET_RADIUS = 4;
export const BULLET_HIT_DISTANCE = 30;

export const STAR_TTL = 0.8;
export const STAR_RISE = 40;
export const STAR_RADIUS = 10;
export const STAR_SPIN = Math.PI * 3;

export const EXPLOSION_FRAME_DURATION = 0.08;
export const EXPLOSION_SCALE = 2;
export const BULLET_SCALE = 2;

export const ENEMY_SHOT_SPEED = 400;
export const ENEMY_SHOT_DAMAGE_CHANCE = 0.5;
export const ENEMY_SHOT_HIT_DISTANCE = 20;

export const ACTIVE_FIRE_INTERVAL = 0.1;

export const GAMEOVER_DURATION = 10;
export const RESPAWN_DURATION = 30;
export const SESSION_INTRO_DURATION = 1;
export const SESSION_ENEMY_GRACE = 1.5;
