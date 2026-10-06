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

export interface Bullet {
	target: Entity;
	speed: number;
	shooterId: string;
}

export interface Explosion {
	age: number;
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
	bullet: Bullet;
	star: Star;
	explosion: Explosion;
	xp: number;
	view: Text;
	bar: Graphics;
	body: Graphics | Sprite;
	sprite: Sprite;
}

export type Entity = Partial<EntityComponents>;
