import { Sprite } from "pixi.js";
import { BULLET_SCALE } from "../config.js";
import type { System, RenderSystemFactory } from "./types.js";

const SHOT_TINT = 0xff6666;

export const createEnemyShotRenderSystem: RenderSystemFactory = (ctx) => {
	const shots = ctx.world.with("enemyShot", "position");

	const unsubscribeAdded = shots.onEntityAdded.subscribe((entity) => {
		const body = new Sprite(ctx.assets.bullet);
		body.anchor.set(0.5);
		body.scale.set(BULLET_SCALE);
		body.tint = SHOT_TINT;
		entity.body = body;
		ctx.app.stage.addChild(body);
	});

	const unsubscribeRemoved = shots.onEntityRemoved.subscribe((entity) => {
		entity.body?.destroy();
		entity.body = undefined;
	});

	const system: System = () => {
		for (const entity of shots) {
			if (entity.body) {
				entity.body.x = entity.position.x;
				entity.body.y = entity.position.y;
			}
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of shots) {
			entity.body?.destroy();
			entity.body = undefined;
		}
	};

	return system;
};
