import { Graphics } from "pixi.js";
import { VIEWER_GROUND_MARGIN } from "../config.js";
import type { System, SystemFactory } from "./types.js";

const PORTAL_RADIUS = 32;
const PORTAL_COLOR = 0x9b59ff;
const PORTAL_EDGE = 0xd6b3ff;
const BAR_WIDTH = 48;
const BAR_HEIGHT = 4;
const BAR_GAP = 8;

export const createPortalRenderSystem: SystemFactory = (ctx) => {
	const portals = ctx.world.with("respawning");

	const unsubscribeAdded = portals.onEntityAdded.subscribe((entity) => {
		const body = new Graphics();
		entity.body = body;
		ctx.app.stage.addChild(body);
	});

	const unsubscribeRemoved = portals.onEntityRemoved.subscribe((entity) => {
		entity.body?.destroy();
		entity.body = undefined;
	});

	const system: System = () => {
		const groundY = ctx.app.screen.height - VIEWER_GROUND_MARGIN;
		const time = performance.now() / 1000;

		for (const entity of portals) {
			const body = entity.body;
			if (!(body instanceof Graphics)) continue;

			const { elapsed, duration, x } = entity.respawning;
			const progress = Math.min(1, elapsed / duration);
			const pulse = 0.5 + 0.5 * Math.sin(time * 4);
			const centerY = groundY - PORTAL_RADIUS;

			body.clear();

			body
				.ellipse(x, centerY, PORTAL_RADIUS * 0.6, PORTAL_RADIUS)
				.fill({ color: PORTAL_COLOR, alpha: 0.25 + 0.2 * pulse })
				.ellipse(x, centerY, PORTAL_RADIUS * 0.6, PORTAL_RADIUS)
				.stroke({
					color: PORTAL_EDGE,
					alpha: 0.6 + 0.3 * pulse,
					width: 2,
				});

			body
				.rect(x - BAR_WIDTH / 2, groundY + BAR_GAP, BAR_WIDTH, BAR_HEIGHT)
				.fill({ color: 0x000000, alpha: 0.5 })
				.rect(
					x - BAR_WIDTH / 2,
					groundY + BAR_GAP,
					BAR_WIDTH * progress,
					BAR_HEIGHT,
				)
				.fill(PORTAL_COLOR);
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of portals) {
			entity.body?.destroy();
			entity.body = undefined;
		}
	};

	return system;
};
