export interface ShipSheet {
	cols: number;
	rows: number;
	frames: number[];
}

const range = (from: number, to: number) =>
	Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const SHIP_SHEETS: ShipSheet[] = [
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
