import { Assets, Rectangle, Texture } from "pixi.js";

const EXPLOSION_FRAMES = [
	[164, 84, 9, 9],
	[176, 81, 15, 15],
	[178, 96, 16, 15],
	[195, 96, 16, 15],
];

const BULLET_FRAME = [4, 68, 9, 9];

export interface GameAssets {
	explosion: Texture[];
	bullet: Texture;
}

export async function loadAssets(): Promise<GameAssets> {
	const base = await Assets.load<Texture>("fx/fire.png");
	base.source.scaleMode = "nearest";

	const cut = ([x, y, w, h]: number[]) =>
		new Texture({ source: base.source, frame: new Rectangle(x, y, w, h) });

	return {
		explosion: EXPLOSION_FRAMES.map(cut),
		bullet: cut(BULLET_FRAME),
	};
}
