import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const FX_DIR = fileURLToPath(new URL("../static/fx/", import.meta.url));

const DEFAULT_GRID = { cellWidth: 16, cellHeight: 16, offsetX: 0, offsetY: 0 };

const SHEET_GRIDS = {
	// "fire.png": { cellWidth: 16, cellHeight: 16, offsetX: 0, offsetY: 0 },
};

function pngSize(path) {
	const buffer = readFileSync(path);
	return {
		width: buffer.readUInt32BE(16),
		height: buffer.readUInt32BE(20),
	};
}

function rowName(index) {
	let name = "";
	let n = index;
	do {
		name = String.fromCharCode(97 + (n % 26)) + name;
		n = Math.floor(n / 26) - 1;
	} while (n >= 0);
	return name;
}

function buildSvg(pngName, width, height, grid) {
	const { cellWidth, cellHeight, offsetX, offsetY } = grid;
	const cols = Math.floor((width - offsetX) / cellWidth);
	const rows = Math.floor((height - offsetY) / cellHeight);

	const parts = [
		`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
		`<image href="${pngName}" x="0" y="0" width="${width}" height="${height}"/>`,
	];

	for (let col = 0; col <= cols; col++) {
		const x = offsetX + col * cellWidth;
		parts.push(
			`<line x1="${x}" y1="${offsetY}" x2="${x}" y2="${offsetY + rows * cellHeight}" stroke="#00ffff" stroke-opacity="0.5" stroke-width="0.5"/>`,
		);
	}
	for (let row = 0; row <= rows; row++) {
		const y = offsetY + row * cellHeight;
		parts.push(
			`<line x1="${offsetX}" y1="${y}" x2="${offsetX + cols * cellWidth}" y2="${y}" stroke="#00ffff" stroke-opacity="0.5" stroke-width="0.5"/>`,
		);
	}

	const fontSize = (Math.min(cellWidth, cellHeight) * 0.4) / 2;
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const label = `${rowName(row)}${col + 1}`;
			const x = offsetX + (col + 1) * cellWidth - 1;
			const y = offsetY + (row + 1) * cellHeight - 1;
			parts.push(
				`<text x="${x}" y="${y}" font-family="monospace" font-size="${fontSize}" fill="#ffff00" stroke="#000000" stroke-width="0.5" paint-order="stroke" text-anchor="end">${label}</text>`,
			);
		}
	}

	parts.push(`</svg>`);
	return parts.join("\n");
}

const sheets = readdirSync(FX_DIR).filter((file) => file.endsWith(".png"));

for (const sheet of sheets) {
	const { width, height } = pngSize(join(FX_DIR, sheet));
	const grid = SHEET_GRIDS[sheet] ?? DEFAULT_GRID;
	const svg = buildSvg(sheet, width, height, grid);
	const out = join(FX_DIR, sheet.replace(/\.png$/, ".grid.svg"));
	writeFileSync(out, svg);
	console.log(
		`${sheet}: ${width}x${height}, grid ${grid.cellWidth}x${grid.cellHeight} -> ${out}`,
	);
}
