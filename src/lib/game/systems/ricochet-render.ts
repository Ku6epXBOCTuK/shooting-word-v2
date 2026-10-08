import { Sprite } from "pixi.js";
import { BULLET_SCALE } from "../config.js";
import type { System, SystemFactory } from "./types.js";

export const createRicochetRenderSystem: SystemFactory = (ctx) => {
	const ricochets = ctx.world.with("ricochet", "position");

	const unsubscribeAdded = ricochets.onEntityAdded.subscribe((entity) => {
		const body = new Sprite(ctx.assets.bullet);
		body.anchor.set(0.5);
		ctx.app.stage.addChild(body);
		entity.body = body;
	});

	const unsubscribeRemoved = ricochets.onEntityRemoved.subscribe((entity) => {
		entity.body?.destroy();
		entity.body = undefined;
	});

	const system: System = () => {
		for (const entity of ricochets) {
			if (!entity.body) continue;

			const { vx, vy, age, ttl } = entity.ricochet;
			entity.body.x = entity.position.x;
			entity.body.y = entity.position.y;
			entity.body.rotation = Math.atan2(vy, vx);
			entity.body.scale.set(BULLET_SCALE * (1 - age / ttl));
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of ricochets) {
			entity.body?.destroy();
			entity.body = undefined;
		}
	};

	return system;
};
