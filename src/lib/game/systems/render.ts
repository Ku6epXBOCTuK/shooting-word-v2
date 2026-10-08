import { Graphics, Text, TextStyle } from "pixi.js";
import { FONT_SIZE } from "../config.js";
import type { System, SystemFactory } from "./types.js";

const BAR_HEIGHT = 4;
const BAR_GAP = 6;
const PLATE_PAD_X = 8;
const PLATE_PAD_Y = 4;
const PLATE_RADIUS = 6;
const PLATE_ALPHA = 0.7;

export const createRenderSystem: SystemFactory = (ctx) => {
	const words = ctx.world.with("word", "position");
	const style = new TextStyle({ fill: "#ffffff", fontSize: FONT_SIZE });

	const unsubscribeAdded = words.onEntityAdded.subscribe((entity) => {
		const plate = new Graphics();
		entity.plate = plate;

		const view = new Text({ text: entity.word.text, style });
		view.anchor.set(0.5);
		entity.view = view;

		const bar = new Graphics();
		entity.bar = bar;

		ctx.app.stage.addChild(plate, view, bar);
	});

	const unsubscribeRemoved = words.onEntityRemoved.subscribe((entity) => {
		entity.plate?.destroy();
		entity.plate = undefined;
		entity.view?.destroy();
		entity.view = undefined;
		entity.bar?.destroy();
		entity.bar = undefined;
	});

	const system: System = () => {
		for (const entity of words) {
			const { plate, view, bar } = entity;
			if (!plate || !view || !bar) continue;

			view.x = entity.position.x;
			view.y = entity.position.y;
			view.scale.set(entity.scale ?? 1);
			view.tint = entity.armed ? 0xff4444 : 0xffffff;

			const barZone = entity.lifetime ? BAR_GAP + BAR_HEIGHT + PLATE_PAD_Y : 0;
			plate
				.clear()
				.roundRect(
					entity.position.x - view.width / 2 - PLATE_PAD_X,
					entity.position.y - view.height / 2 - PLATE_PAD_Y,
					view.width + PLATE_PAD_X * 2,
					view.height + PLATE_PAD_Y * 2 + barZone,
					PLATE_RADIUS,
				)
				.fill({ color: 0x000000, alpha: PLATE_ALPHA });
			if (entity.lifetime) {
				const progress = Math.min(1, entity.lifetime.age / entity.lifetime.ttl);

				view.alpha = 1;
				const hue = 120 * (1 - progress);
				const width = view.width * progress;
				bar
					.clear()
					.rect(
						entity.position.x - view.width / 2,
						entity.position.y + view.height / 2 + BAR_GAP,
						width,
						BAR_HEIGHT,
					)
					.fill(`hsl(${hue}, 90%, 50%)`);
				bar.alpha = view.alpha;
			} else {
				view.alpha = 1;
				bar.clear();
			}

			plate.alpha = view.alpha;
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of words) {
			entity.plate?.destroy();
			entity.plate = undefined;
			entity.view?.destroy();
			entity.view = undefined;
			entity.bar?.destroy();
			entity.bar = undefined;
		}
	};

	return system;
};
