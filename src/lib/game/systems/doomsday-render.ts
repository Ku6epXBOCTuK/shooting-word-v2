import { Graphics } from "pixi.js";
import { VIEWER_HEIGHT } from "../config.js";
import type { System, RenderSystemFactory } from "./types.js";

const CORE_RADIUS = 72;
const CORE_COLOR = 0xff3322;
const BOLT_RADIUS = 4;
const BOLT_COLOR = 0xff3322;
const AURA_COLOR = 0xff2211;
const AURA_GAP = 10;

export const createDoomsdayRenderSystem: RenderSystemFactory = (ctx) => {
	const devices = ctx.world.with("doomsday", "position");
	const bolts = ctx.world.with("doomsdayBolt", "position");
	const viewers = ctx.world.with("viewer", "position").without("dead");

	const unsubscribeDeviceAdded = devices.onEntityAdded.subscribe((entity) => {
		entity.body = new Graphics();
		ctx.app.stage.addChild(entity.body);
	});
	const unsubscribeDeviceRemoved = devices.onEntityRemoved.subscribe(
		(entity) => {
			entity.body?.destroy();
			entity.body = undefined;
		},
	);
	const unsubscribeBoltAdded = bolts.onEntityAdded.subscribe((entity) => {
		entity.body = new Graphics().circle(0, 0, BOLT_RADIUS).fill(BOLT_COLOR);
		ctx.app.stage.addChild(entity.body);
	});
	const unsubscribeBoltRemoved = bolts.onEntityRemoved.subscribe((entity) => {
		entity.body?.destroy();
		entity.body = undefined;
	});

	const system: System = () => {
		const time = performance.now() / 1000;

		for (const entity of devices) {
			const body = entity.body;
			if (!(body instanceof Graphics)) continue;
			body.clear();

			const state = entity.doomsday;
			const pulse = 0.5 + 0.5 * Math.sin(time * 6);

			for (const viewer of viewers) {
				if (viewer.viewer.userId !== state.shooterId) continue;
				const halfHeight =
					(viewer.size?.height ?? VIEWER_HEIGHT * ctx.settings.viewerScale) / 2;
				body
					.circle(
						viewer.position.x,
						viewer.position.y,
						halfHeight + AURA_GAP + pulse * 4,
					)
					.stroke({
						color: AURA_COLOR,
						alpha: 0.4 + 0.3 * pulse,
						width: 3,
					});
			}

			if (state.active) {
				body
					.circle(
						entity.position.x,
						entity.position.y,
						CORE_RADIUS * (0.8 + 0.4 * pulse),
					)
					.fill({ color: CORE_COLOR, alpha: 0.25 + 0.2 * pulse })
					.circle(entity.position.x, entity.position.y, CORE_RADIUS * 0.4)
					.fill({ color: CORE_COLOR, alpha: 0.6 });
			}
		}

		for (const bolt of bolts) {
			if (!bolt.body) continue;
			bolt.body.x = bolt.position.x;
			bolt.body.y = bolt.position.y;
		}
	};

	system.dispose = () => {
		unsubscribeDeviceAdded();
		unsubscribeDeviceRemoved();
		unsubscribeBoltAdded();
		unsubscribeBoltRemoved();
		for (const entity of devices) {
			entity.body?.destroy();
			entity.body = undefined;
		}
		for (const bolt of bolts) {
			bolt.body?.destroy();
			bolt.body = undefined;
		}
	};

	return system;
};
