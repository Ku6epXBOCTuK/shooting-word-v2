import { Sprite } from "pixi.js";
import { BULLET_SCALE } from "../config.js";
import type { System, RenderSystemFactory } from "./types.js";

export const createBulletRenderSystem: RenderSystemFactory = (ctx) => {
	const bullets = ctx.world.with("bullet", "position");

	const unsubscribeAdded = bullets.onEntityAdded.subscribe((entity) => {
		const body = new Sprite(ctx.assets.bullet);
		body.anchor.set(0.5);
		body.scale.set(BULLET_SCALE);
		entity.body = body;
		ctx.app.stage.addChild(body);
	});

	const unsubscribeRemoved = bullets.onEntityRemoved.subscribe((entity) => {
		entity.body?.destroy();
		entity.body = undefined;
	});

	const system: System = () => {
		for (const entity of bullets) {
			if (entity.body) {
				entity.body.x = entity.position.x;
				entity.body.y = entity.position.y;
			}
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of bullets) {
			entity.body?.destroy();
			entity.body = undefined;
		}
	};

	return system;
};
