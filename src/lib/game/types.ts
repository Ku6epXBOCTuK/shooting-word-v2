import type { Text } from "pixi.js";

export interface Position {
	x: number;
	y: number;
}

export interface Velocity {
	x: number;
	y: number;
}

export interface Word {
	text: string;
	userId: string;
	user: string;
}

export type Entity = Partial<{
	position: Position;
	velocity: Velocity;
	word: Word;
	view: Text;
}>;
