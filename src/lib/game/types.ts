import type { Graphics, Sprite, Text } from "pixi.js";

export interface Position {
	x: number;
	y: number;
}

export interface Position3 {
	x: number;
	y: number;
	z: number;
}

export interface Velocity3 {
	x: number;
	y: number;
	z: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Lifetime {
	age: number;
	ttl: number;
}

export interface Word {
	text: string;
	userId: string;
	user: string;
}

export interface Viewer {
	userId: string;
	user: string;
	lastSeen: number;
	skin: number;
	bot?: boolean;
}

export type ViewerIdentity = Pick<Viewer, "userId" | "user" | "bot">;

export interface Walker {
	direction: 1 | -1;
	speed: number;
	timer: number;
}

export interface Homing {
	target: Entity;
	speed: number;
	hitDistance: number;
}

export interface Bullet {
	shooterId: string;
}

export interface Explosion {
	age: number;
}

export interface EnemyShot {
	damage: number;
}

export interface Armed {
	enqueuedAt: number;
}

export interface Ricochet {
	vx: number;
	vy: number;
	age: number;
	ttl: number;
}

export interface Spark {
	vx: number;
	vy: number;
	age: number;
	ttl: number;
}

export interface Hitpoints {
	current: number;
	max: number;
}

export interface Shield {
	expiresAt: number;
	hp: number;
	regenIn?: number;
}

export interface HitBy {
	shooterId: string;
}

export const SESSIONPHASE = {
	IDLE: "idle",
	STARTING: "starting",
	PLAYING: "playing",
	ENDING: "ending",
	GAMEOVER: "gameover",
	INTERMISSION: "intermission",
} as const;

export type SessionPhase = (typeof SESSIONPHASE)[keyof typeof SESSIONPHASE];

export interface Session {
	phase: SessionPhase;
	timer: number;
	afk: boolean;
}

export interface Banner {
	text: string;
	scale?: number;
}

export interface Respawning {
	elapsed: number;
	duration: number;
	x: number;
}

export interface Star {
	age: number;
	ttl: number;
	startY: number;
}

export interface EntityComponents {
	position: Position;
	position3: Position3;
	velocity3: Velocity3;
	size: Size;
	scale: number;
	lifetime: Lifetime;
	word: Word;
	viewer: Viewer;
	walker: Walker;
	homing: Homing;
	arrived: boolean;
	bullet: Bullet;
	star: Star;
	explosion: Explosion;
	enemyShot: EnemyShot;
	armed: Armed;
	ricochet: Ricochet;
	spark: Spark;
	hp: Hitpoints;
	shield: Shield;
	hitBy: HitBy;
	session: Session;
	banner: Banner;
	dead: boolean;
	bot: boolean;
	respawning: Respawning;
	timedOut: boolean;
	expired: boolean;
	xp: number;
	batteries: number;
	revives: number;
	view: Text;
	bar: Graphics;
	plate: Graphics;
	body: Graphics | Sprite;
	sprite: Sprite;
}

export type Entity = Partial<EntityComponents>;
