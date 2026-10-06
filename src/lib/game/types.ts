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

export interface Lifetime {
	age: number;
	ttl: number;
}

export interface Word {
	text: string;
	userId: string;
	user: string;
}

export type Entity = Partial<{
	position: Position;
	position3: Position3;
	velocity3: Velocity3;
	scale: number;
	lifetime: Lifetime;
	word: Word;
	view: Text;
	bar: Graphics;
}>;
