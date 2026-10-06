import { Graphics } from "pixi.js";
import { BULLET_RADIUS } from "../config.js";
import type { System, SystemFactory } from "./types.js";

export const createBulletRenderSystem: SystemFactory = (ctx) => {
	const bullets = ctx.world.with("bullet", "position");

	const unsubscribeAdded = bullets.onEntityAdded.subscribe((entity) => {
		const body = new Graphics().circle(0, 0, BULLET_RADIUS).fill("#ffd166");
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
