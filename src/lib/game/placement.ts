import { estimateWordSize } from "./spawn.js";
import type { Position, Position3, Size, Word } from "./types.js";

const PADDING = 20;
const EDGE_MARGIN = 24;
const MAX_ATTEMPTS = 20;

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

function rectAt(cx: number, cy: number, size: Size): Rect {
	return {
		x: cx - size.width / 2 - PADDING,
		y: cy - size.height / 2 - PADDING,
		width: size.width + PADDING * 2,
		height: size.height + PADDING * 2,
	};
}

function overlaps(a: Rect, b: Rect): boolean {
	return (
		a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y
	);
}

interface PlacedEntity {
	word: Word;
	position: Position;
	position3?: Position3;
	size?: Size;
}

export function collectTakenRects(
	entities: Iterable<PlacedEntity>,
	screen: Size,
): Rect[] {
	const rects: Rect[] = [];

	for (const entity of entities) {
		const size = entity.size ?? estimateWordSize(entity.word.text);
		const cx = entity.position3
			? screen.width / 2 + entity.position3.x
			: entity.position.x;
		const cy = entity.position3
			? screen.height / 2 + entity.position3.y
			: entity.position.y;
		rects.push(rectAt(cx, cy, size));
	}

	return rects;
}

export function findPlacement(
	screen: Size,
	size: Size,
	taken: Rect[],
	bottomMargin = 0,
): { x: number; y: number } | null {
	const usableHeight = Math.max(0, screen.height - bottomMargin);
	const maxOffsetX = Math.max(
		0,
		screen.width / 2 - size.width / 2 - EDGE_MARGIN,
	);
	const maxOffsetY = Math.max(
		0,
		usableHeight / 2 - size.height / 2 - EDGE_MARGIN,
	);
	const centerShiftY = -bottomMargin / 2;

	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
		const offsetX = (Math.random() * 2 - 1) * maxOffsetX;
		const offsetY = centerShiftY + (Math.random() * 2 - 1) * maxOffsetY;
		const candidate = rectAt(
			screen.width / 2 + offsetX,
			screen.height / 2 + offsetY,
			size,
		);

		if (!taken.some((rect) => overlaps(candidate, rect))) {
			return { x: offsetX, y: offsetY };
		}
	}

	return null;
}
