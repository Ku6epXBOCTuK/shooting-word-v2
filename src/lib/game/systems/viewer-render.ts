import { Graphics, Text, TextStyle } from "pixi.js";
import { VIEWER_HEIGHT, VIEWER_WIDTH } from "../config.js";
import type { System, SystemFactory } from "./types.js";

const LABEL_GAP = 4;

function colorFromId(userId: string): string {
	let hash = 0;
	for (const char of userId) {
		hash = (hash * 31 + char.charCodeAt(0)) % 360;
	}
	return `hsl(${hash}, 70%, 55%)`;
}

export const createViewerRenderSystem: SystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer", "position");
	const labelStyle = new TextStyle({ fill: "#ffffff", fontSize: 12 });

	const unsubscribeAdded = viewers.onEntityAdded.subscribe((entity) => {
		const body = new Graphics();
		body
			.rect(-VIEWER_WIDTH / 2, -VIEWER_HEIGHT / 2, VIEWER_WIDTH, VIEWER_HEIGHT)
			.fill(colorFromId(entity.viewer.userId));
		entity.body = body;

		const label = new Text({ text: entity.viewer.user, style: labelStyle });
		label.anchor.set(0.5, 1);
		entity.view = label;

		ctx.app.stage.addChild(body, label);
	});

	const unsubscribeRemoved = viewers.onEntityRemoved.subscribe((entity) => {
		entity.body?.destroy();
		entity.body = undefined;
		entity.view?.destroy();
		entity.view = undefined;
	});

	const system: System = () => {
		for (const entity of viewers) {
			if (entity.body) {
				entity.body.x = entity.position.x;
				entity.body.y = entity.position.y;
			}
			if (entity.view) {
				entity.view.x = entity.position.x;
				entity.view.y = entity.position.y - VIEWER_HEIGHT / 2 - LABEL_GAP;
			}
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const entity of viewers) {
			entity.body?.destroy();
			entity.body = undefined;
			entity.view?.destroy();
			entity.view = undefined;
		}
	};

	return system;
};
