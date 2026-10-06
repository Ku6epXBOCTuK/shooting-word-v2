import { Assets, Rectangle, Texture } from "pixi.js";

const EXPLOSION_FRAMES = [
	[164, 84, 9, 9],
	[176, 81, 15, 15],
	[178, 96, 16, 15],
	[195, 96, 16, 15],
];

const BULLET_FRAME = [4, 68, 9, 9];

const range = (from: number, to: number) =>
	Array.from({ length: to - from + 1 }, (_, i) => from + i);

interface ShipSheet {
	cols: number;
	rows: number;
	frames: number[];
}

const SHIP_SHEETS: ShipSheet[] = [
	{ cols: 6, rows: 3, frames: [...range(0, 9), ...range(12, 17)] },
	{ cols: 6, rows: 3, frames: [...range(0, 9), ...range(12, 15)] },
	{ cols: 5, rows: 2, frames: range(0, 9) },
	{ cols: 7, rows: 3, frames: range(0, 19) },
	{ cols: 5, rows: 2, frames: range(0, 9) },
	{ cols: 5, rows: 1, frames: range(0, 4) },
	{ cols: 5, rows: 3, frames: range(0, 14) },
	{ cols: 6, rows: 1, frames: range(0, 5) },
	{ cols: 5, rows: 2, frames: range(0, 8) },
	{ cols: 4, rows: 1, frames: range(0, 3) },
	{ cols: 7, rows: 2, frames: range(0, 10) },
	{ cols: 4, rows: 3, frames: range(0, 11) },
	{ cols: 8, rows: 2, frames: range(0, 11) },
	{ cols: 4, rows: 2, frames: range(0, 7) },
	{ cols: 6, rows: 2, frames: range(0, 10) },
	{ cols: 4, rows: 3, frames: range(0, 11) },
	{ cols: 6, rows: 2, frames: range(0, 11) },
	{ cols: 4, rows: 2, frames: range(0, 7) },
	{ cols: 4, rows: 2, frames: range(0, 7) },
	{ cols: 5, rows: 3, frames: range(0, 13) },
];

export const SHIP_COUNT = SHIP_SHEETS.length;

export interface GameAssets {
	explosion: Texture[];
	bullet: Texture;
	ships: Texture[][];
}

function cut(source: Texture["source"], [x, y, w, h]: number[]) {
	return new Texture({ source, frame: new Rectangle(x, y, w, h) });
}

async function loadShips(): Promise<Texture[][]> {
	return Promise.all(
		SHIP_SHEETS.map(async ({ cols, rows, frames }, index) => {
			const base = await Assets.load<Texture>(`ships/tinyShip${index + 1}.png`);
			base.source.scaleMode = "nearest";

			const frameWidth = Math.floor(base.width / cols);
			const frameHeight = Math.floor(base.height / rows);

			return frames.map((frame) => {
				const col = frame % cols;
				const row = Math.floor(frame / cols);
				return cut(base.source, [
					col * frameWidth,
					row * frameHeight,
					frameWidth,
					frameHeight,
				]);
			});
		}),
	);
}

export async function loadAssets(): Promise<GameAssets> {
	const base = await Assets.load<Texture>("fx/fire.png");
	base.source.scaleMode = "nearest";

	return {
		explosion: EXPLOSION_FRAMES.map((frame) => cut(base.source, frame)),
		bullet: cut(base.source, BULLET_FRAME),
		ships: await loadShips(),
	};
}
