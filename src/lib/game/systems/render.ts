import { Text, TextStyle } from "pixi.js";
import type { System, SystemFactory } from "./types.js";

export const createRenderSystem: SystemFactory = (ctx) => {
	const words = ctx.world.with("word", "position");
	const style = new TextStyle({ fill: "#ffffff", fontSize: 28 });

	const unsubscribeAdded = words.onEntityAdded.subscribe((entity) => {
		const view = new Text({ text: entity.word.text, style });
		entity.view = view;
		ctx.app.stage.addChild(view);
	});

	const unsubscribeRemoved = words.onEntityRemoved.subscribe((entity) => {
		entity.view?.destroy();
		entity.view = undefined;
	});

	const system: System = () => {
		for (const entity of words) {
			if (entity.view) {
				entity.view.x = entity.position.x;
				entity.view.y = entity.position.y;
			}
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of words) {
			entity.view?.destroy();
			entity.view = undefined;
		}
	};

	return system;
};
