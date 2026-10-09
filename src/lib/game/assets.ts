import { Assets, Rectangle, Texture } from "pixi.js";
import { asset } from "$app/paths";
import { EXPLOSION_FRAME_LABELS } from "./config.js";
import { frameRect } from "./frame-label.js";
import { SHIP_SHEETS } from "./ships.js";

export { SHIP_COUNT } from "./ships.js";

const SHIP_PATHS = [
	"ships/tinyShip1.png",
	"ships/tinyShip2.png",
	"ships/tinyShip3.png",
	"ships/tinyShip4.png",
	"ships/tinyShip5.png",
	"ships/tinyShip6.png",
	"ships/tinyShip7.png",
	"ships/tinyShip8.png",
	"ships/tinyShip9.png",
	"ships/tinyShip10.png",
	"ships/tinyShip11.png",
	"ships/tinyShip12.png",
	"ships/tinyShip13.png",
	"ships/tinyShip14.png",
	"ships/tinyShip15.png",
	"ships/tinyShip16.png",
	"ships/tinyShip17.png",
	"ships/tinyShip18.png",
	"ships/tinyShip19.png",
	"ships/tinyShip20.png",
] as const;

const BULLET_FRAME = "e1";

export interface GameAssets {
	explosion: Texture[];
	bullet: Texture;
	ships: Texture[][];
}

function cut(source: Texture["source"], [x, y, w, h]: number[]) {
	return new Texture({ source, frame: new Rectangle(x, y, w, h) });
}

export async function loadShips(): Promise<Texture[][]> {
	return Promise.all(
		SHIP_SHEETS.map(async ({ cols, rows, frames }, index) => {
			const base = await Assets.load<Texture>(asset(SHIP_PATHS[index]));
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
	const base = await Assets.load<Texture>(asset("fx/fire.png"));
	base.source.scaleMode = "nearest";

	return {
		explosion: EXPLOSION_FRAME_LABELS.map((label) =>
			cut(base.source, frameRect(label)),
		),
		bullet: cut(base.source, frameRect(BULLET_FRAME)),
		ships: await loadShips(),
	};
}
