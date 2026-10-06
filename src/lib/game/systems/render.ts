import { Graphics, Text, TextStyle } from "pixi.js";
import { FONT_SIZE, WORD_FADE_OUT } from "../config.js";
import type { System, SystemFactory } from "./types.js";

const BAR_HEIGHT = 4;
const BAR_GAP = 6;

export const createRenderSystem: SystemFactory = (ctx) => {
	const words = ctx.world.with("word", "position");
	const style = new TextStyle({ fill: "#ffffff", fontSize: FONT_SIZE });

	const unsubscribeAdded = words.onEntityAdded.subscribe((entity) => {
		const view = new Text({ text: entity.word.text, style });
		view.anchor.set(0.5);
		entity.view = view;

		const bar = new Graphics();
		entity.bar = bar;

		ctx.app.stage.addChild(view, bar);
	});

	const unsubscribeRemoved = words.onEntityRemoved.subscribe((entity) => {
		entity.view?.destroy();
		entity.view = undefined;
		entity.bar?.destroy();
		entity.bar = undefined;
	});

	const system: System = () => {
		for (const entity of words) {
			const { view, bar } = entity;
			if (!view || !bar) continue;

			view.x = entity.position.x;
			view.y = entity.position.y;
			view.scale.set(entity.scale ?? 1);

			if (entity.lifetime) {
				const remaining = entity.lifetime.ttl - entity.lifetime.age;
				const progress = Math.max(0, remaining / entity.lifetime.ttl);

				view.alpha = Math.min(1, remaining / WORD_FADE_OUT);

				const width = view.width * progress;
				bar
					.clear()
					.rect(
						entity.position.x - view.width / 2,
						entity.position.y + view.height / 2 + BAR_GAP,
						width,
						BAR_HEIGHT,
					)
					.fill("#ffffff");
				bar.alpha = view.alpha;
			} else {
				view.alpha = 1;
				bar.clear();
			}
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of words) {
			entity.view?.destroy();
			entity.view = undefined;
			entity.bar?.destroy();
			entity.bar = undefined;
		}
	};

	return system;
};
