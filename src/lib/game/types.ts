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
}

export type ViewerIdentity = Pick<Viewer, "userId" | "user">;

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

export interface Hitpoints {
	current: number;
	max: number;
}

export interface Shield {
	expiresAt: number;
}

export interface HitBy {
	shooterId: string;
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
	hp: Hitpoints;
	shield: Shield;
	hitBy: HitBy;
	expired: boolean;
	xp: number;
	view: Text;
	bar: Graphics;
	plate: Graphics;
	body: Graphics | Sprite;
	sprite: Sprite;
}

export type Entity = Partial<EntityComponents>;
