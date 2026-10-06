import type { Graphics, Text } from "pixi.js";

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

export interface EntityComponents {
	position: Position;
	position3: Position3;
	velocity3: Velocity3;
	size: Size;
	scale: number;
	lifetime: Lifetime;
	word: Word;
	view: Text;
	bar: Graphics;
}

export type Entity = Partial<EntityComponents>;
