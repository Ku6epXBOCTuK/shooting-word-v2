import { Graphics } from "pixi.js";
import { STAR_RADIUS, STAR_SPIN } from "../config.js";
import type { System, SystemFactory } from "./types.js";

export const createStarRenderSystem: SystemFactory = (ctx) => {
	const stars = ctx.world.with("star", "position");

	const unsubscribeAdded = stars.onEntityAdded.subscribe((entity) => {
		const body = new Graphics()
			.star(0, 0, 5, STAR_RADIUS, STAR_RADIUS * 0.45)
			.fill("#ffd700");
		entity.body = body;
		ctx.app.stage.addChild(body);
	});

	const unsubscribeRemoved = stars.onEntityRemoved.subscribe((entity) => {
		entity.body?.destroy();
		entity.body = undefined;
	});

	const system: System = () => {
		for (const entity of stars) {
			if (!entity.body) continue;

			const t = Math.min(1, entity.star.age / entity.star.ttl);
			entity.body.x = entity.position.x;
			entity.body.y = entity.position.y;
			entity.body.rotation = t * STAR_SPIN;
			entity.body.alpha = 1 - t * t;
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of stars) {
			entity.body?.destroy();
			entity.body = undefined;
		}
	};

	return system;
};
