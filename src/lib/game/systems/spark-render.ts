import { Graphics } from "pixi.js";
import type { System, RenderSystemFactory } from "./types.js";

const SPARK_RADIUS = 2;
const SPARK_COLOR = 0xffdd66;

export const createSparkRenderSystem: RenderSystemFactory = (ctx) => {
	const sparks = ctx.world.with("spark", "position");

	const unsubscribeAdded = sparks.onEntityAdded.subscribe((entity) => {
		const body = new Graphics()
			.circle(0, 0, entity.spark.radius ?? SPARK_RADIUS)
			.fill(SPARK_COLOR);
		ctx.app.stage.addChild(body);
		entity.body = body;
	});

	const unsubscribeRemoved = sparks.onEntityRemoved.subscribe((entity) => {
		entity.body?.destroy();
		entity.body = undefined;
	});

	const system: System = () => {
		for (const entity of sparks) {
			if (!entity.body) continue;

			const { age, ttl } = entity.spark;
			entity.body.x = entity.position.x;
			entity.body.y = entity.position.y;
			entity.body.alpha = 1 - age / ttl;
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of sparks) {
			entity.body?.destroy();
			entity.body = undefined;
		}
	};

	return system;
};
