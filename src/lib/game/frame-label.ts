const LABEL_PATTERN = /^([a-z]+)([1-9]\d*)$/;

export function parseFrameLabel(label: string): { row: number; col: number } {
	const match = LABEL_PATTERN.exec(label);
	if (!match) {
		throw new Error(`invalid frame label: ${label}`);
	}

	let row = 0;
	for (const char of match[1]) {
		row = row * 26 + (char.charCodeAt(0) - 96);
	}

	return { row, col: Number(match[2]) };
}

export function frameRect(
	label: string,
	cell = 16,
): [number, number, number, number] {
	const { row, col } = parseFrameLabel(label);
	return [(col - 1) * cell, (row - 1) * cell, cell, cell];
}
