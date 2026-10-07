import { Text, TextStyle } from "pixi.js";
import type { System, SystemFactory } from "./types.js";

const BANNER_FONT_SIZE = 48;

export const createBannerRenderSystem: SystemFactory = (ctx) => {
	const banners = ctx.world.with("banner");
	const style = new TextStyle({ fill: "#ffffff", fontSize: BANNER_FONT_SIZE });

	const unsubscribeAdded = banners.onEntityAdded.subscribe((entity) => {
		const view = new Text({ text: entity.banner.text, style });
		view.anchor.set(0.5);
		entity.view = view;
		ctx.app.stage.addChild(view);
	});

	const unsubscribeRemoved = banners.onEntityRemoved.subscribe((entity) => {
		entity.view?.destroy();
		entity.view = undefined;
	});

	const system: System = () => {
		for (const entity of banners) {
			if (!entity.view) continue;
			entity.view.x = ctx.app.screen.width / 2;
			entity.view.y = ctx.app.screen.height / 2;
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of banners) {
			entity.view?.destroy();
			entity.view = undefined;
		}
	};

	return system;
};
