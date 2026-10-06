import { Sprite } from "pixi.js";
import { EXPLOSION_FRAME_DURATION, EXPLOSION_SCALE } from "../config.js";
import type { System, SystemFactory } from "./types.js";

export const createExplosionRenderSystem: SystemFactory = (ctx) => {
	const explosions = ctx.world.with("explosion", "position");
	const frames = ctx.assets.explosion;

	const unsubscribeAdded = explosions.onEntityAdded.subscribe((entity) => {
		const sprite = new Sprite(frames[0]);
		sprite.anchor.set(0.5);
		sprite.scale.set(EXPLOSION_SCALE);
		entity.sprite = sprite;
		ctx.app.stage.addChild(sprite);
	});

	const unsubscribeRemoved = explosions.onEntityRemoved.subscribe((entity) => {
		entity.sprite?.destroy();
		entity.sprite = undefined;
	});

	const system: System = () => {
		for (const entity of explosions) {
			if (!entity.sprite) continue;

			const frameIndex = Math.min(
				frames.length - 1,
				Math.floor(entity.explosion.age / EXPLOSION_FRAME_DURATION),
			);
			entity.sprite.texture = frames[frameIndex];
			entity.sprite.x = entity.position.x;
			entity.sprite.y = entity.position.y;
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of explosions) {
			entity.sprite?.destroy();
			entity.sprite = undefined;
		}
	};

	return system;
};
