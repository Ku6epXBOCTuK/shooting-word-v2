import { AnimatedSprite, Graphics, Text, TextStyle } from "pixi.js";
import type { Entity } from "../types.js";
import type { System, SystemFactory } from "./types.js";

const LABEL_GAP = 4;
const SHIP_ANIMATION_SPEED = 0.2;
const PLATE_PADDING = 6;
const PLATE_RADIUS = 6;
const PLATE_ALPHA = 0.7;

export const createViewerRenderSystem: SystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer", "position");
	const labelStyle = new TextStyle({ fill: "#ffffff", fontSize: 12 });

	const ships = new Map<Entity, AnimatedSprite>();
	const appliedSkin = new Map<Entity, number>();

	const shipFrames = (skin: number) =>
		ctx.assets.ships[skin] ?? ctx.assets.ships[0];

	const unsubscribeAdded = viewers.onEntityAdded.subscribe((entity) => {
		const plate = new Graphics();
		entity.plate = plate;

		const ship = new AnimatedSprite(shipFrames(entity.viewer.skin));
		ship.anchor.set(0.5);
		ship.animationSpeed = SHIP_ANIMATION_SPEED;
		ship.play();
		ships.set(entity, ship);
		appliedSkin.set(entity, entity.viewer.skin);

		const label = new Text({ text: entity.viewer.user, style: labelStyle });
		label.anchor.set(0.5, 1);
		entity.view = label;

		ctx.app.stage.addChild(plate, ship, label);
	});

	const unsubscribeRemoved = viewers.onEntityRemoved.subscribe((entity) => {
		ships.get(entity)?.destroy();
		ships.delete(entity);
		appliedSkin.delete(entity);
		entity.plate?.destroy();
		entity.plate = undefined;
		entity.view?.destroy();
		entity.view = undefined;
	});

	const system: System = () => {
		for (const entity of viewers) {
			const ship = ships.get(entity);
			if (!ship) continue;

			if (appliedSkin.get(entity) !== entity.viewer.skin) {
				ship.textures = shipFrames(entity.viewer.skin);
				ship.play();
				appliedSkin.set(entity, entity.viewer.skin);
			}

			entity.size = {
				width:
					Math.max(ship.width, entity.view?.width ?? 0) + PLATE_PADDING * 2,
				height: ship.height,
			};

			ship.x = entity.position.x;
			ship.y = entity.position.y;

			if (entity.view) {
				entity.view.x = entity.position.x;
				entity.view.y = entity.position.y - ship.height / 2 - LABEL_GAP;
			}

			if (entity.plate) {
				const labelWidth = entity.view?.width ?? 0;
				const labelTop =
					(entity.view?.y ?? entity.position.y) - (entity.view?.height ?? 0);
				const width = Math.max(ship.width, labelWidth) + PLATE_PADDING * 2;
				const top = labelTop - PLATE_PADDING;
				const bottom = entity.position.y + ship.height / 2 + PLATE_PADDING;

				entity.plate
					.clear()
					.roundRect(
						entity.position.x - width / 2,
						top,
						width,
						bottom - top,
						PLATE_RADIUS,
					)
					.fill({ color: 0x000000, alpha: PLATE_ALPHA });
			}
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const ship of ships.values()) {
			ship.destroy();
		}
		ships.clear();
		appliedSkin.clear();
		for (const entity of viewers) {
			entity.plate?.destroy();
			entity.plate = undefined;
			entity.view?.destroy();
			entity.view = undefined;
		}
	};

	return system;
};
