import { Graphics } from "pixi.js";
import { PLATFORM_HEIGHT } from "../config.js";
import type { System, SystemFactory } from "./types.js";

export const createPlatformSystem: SystemFactory = (ctx) => {
	const graphics = new Graphics();
	ctx.app.stage.addChild(graphics);

	let lastWidth = -1;
	let lastHeight = -1;

	const system: System = () => {
		const { width, height } = ctx.app.screen;
		if (width === lastWidth && height === lastHeight) return;

		lastWidth = width;
		lastHeight = height;

		graphics
			.clear()
			.rect(0, height - PLATFORM_HEIGHT, width, PLATFORM_HEIGHT)
			.fill("#2ecc40");
	};

	system.dispose = () => {
		graphics.destroy();
	};

	return system;
};
