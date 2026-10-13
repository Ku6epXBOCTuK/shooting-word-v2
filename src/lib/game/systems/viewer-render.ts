import { updateShieldBubble } from "#lib/vfx/shield-bubble.js";
import { AnimatedSprite, Graphics, Text, TextStyle } from "pixi.js";
import {
	createMetalShimmer,
	METAL_SHIMMER_MAX_SHIPS,
	type MetalShimmer,
} from "../../vfx/metal-shimmer.js";
import { VIEWER_LABEL_FONT_SIZE, VIEWER_PLATE_PADDING } from "../config.js";
import type { Entity } from "../types.js";
import type { RenderSystemFactory, System } from "./types.js";

const LABEL_GAP = 4;
const SHIP_ANIMATION_SPEED = 0.2;
const PLATE_RADIUS = 6;
const PLATE_ALPHA = 0.7;
const HP_BAR_HEIGHT = 3;
const HP_BAR_GAP = 3;

export const createViewerRenderSystem: RenderSystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer", "position");
	const labelStyle = new TextStyle({
		fill: "#ffffff",
		fontSize: VIEWER_LABEL_FONT_SIZE,
	});

	const appliedSkin = new Map<Entity, number>();
	const shieldBubbles = new Map<Entity, Graphics>();
	const metalShimmers = new Map<Entity, MetalShimmer>();

	const shipFrames = (skin: number) =>
		ctx.assets.ships[skin] ?? ctx.assets.ships[0];

	const unsubscribeAdded = viewers.onEntityAdded.subscribe((entity) => {
		const plate = new Graphics();
		entity.plate = plate;

		const bar = new Graphics();
		entity.bar = bar;

		const ship = new AnimatedSprite(shipFrames(entity.viewer.skin));
		ship.anchor.set(0.5);
		ship.scale.set(ctx.settings.viewerScale);
		ship.animationSpeed = SHIP_ANIMATION_SPEED;
		ship.play();
		entity.sprite = ship;
		appliedSkin.set(entity, entity.viewer.skin);

		const label = new Text({ text: entity.viewer.user, style: labelStyle });
		label.anchor.set(0.5, 1);
		entity.view = label;

		ctx.app.stage.addChild(plate, ship, label, bar);
	});

	const unsubscribeRemoved = viewers.onEntityRemoved.subscribe((entity) => {
		entity.sprite?.destroy();
		entity.sprite = undefined;
		appliedSkin.delete(entity);
		shieldBubbles.get(entity)?.destroy();
		shieldBubbles.delete(entity);
		metalShimmers.get(entity)?.destroy();
		metalShimmers.delete(entity);
		entity.plate?.destroy();
		entity.plate = undefined;
		entity.bar?.destroy();
		entity.bar = undefined;
		entity.view?.destroy();
		entity.view = undefined;
	});

	const system: System = () => {
		for (const entity of viewers) {
			const ship = entity.sprite;
			if (!(ship instanceof AnimatedSprite)) continue;

			const visible = !entity.dead;
			ship.visible = visible;
			if (entity.view) entity.view.visible = visible;
			if (entity.plate) entity.plate.visible = visible;
			if (entity.bar) entity.bar.visible = visible;

			if (appliedSkin.get(entity) !== entity.viewer.skin) {
				ship.textures = shipFrames(entity.viewer.skin);
				ship.play();
				appliedSkin.set(entity, entity.viewer.skin);
			}

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
				const width =
					Math.max(ship.width, labelWidth) + VIEWER_PLATE_PADDING * 2;
				const top = labelTop - VIEWER_PLATE_PADDING;
				const bottom =
					entity.position.y +
					ship.height / 2 +
					HP_BAR_GAP +
					HP_BAR_HEIGHT +
					VIEWER_PLATE_PADDING;

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

			if (entity.bar && entity.hp) {
				const barWidth = ship.width;
				const filled = barWidth * (entity.hp.current / entity.hp.max);
				entity.bar
					.clear()
					.rect(
						entity.position.x - barWidth / 2,
						entity.position.y + ship.height / 2 + HP_BAR_GAP,
						filled,
						HP_BAR_HEIGHT,
					)
					.fill("#2ecc40");
			}

			let bubble = shieldBubbles.get(entity);
			if (entity.shield) {
				if (!bubble) {
					bubble = new Graphics();
					shieldBubbles.set(entity, bubble);
					ctx.app.stage.addChild(bubble);
				}
				updateShieldBubble(bubble, ship, entity.shield.hp, visible);
			} else if (bubble) {
				bubble.destroy();
				shieldBubbles.delete(entity);
			}

			if (entity.ricochetium && visible) {
				let shimmer = metalShimmers.get(entity);
				if (!shimmer && metalShimmers.size < METAL_SHIMMER_MAX_SHIPS) {
					shimmer = createMetalShimmer();
					metalShimmers.set(entity, shimmer);
				}
				if (shimmer) {
					shimmer.update(
						performance.now() / 1000,
						ship.width / Math.max(ship.height, 1),
					);
					if (!ship.filters) ship.filters = [shimmer.filter];
				}
			} else if (ship.filters) {
				ship.filters = null;
				metalShimmers.get(entity)?.destroy();
				metalShimmers.delete(entity);
			}
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		appliedSkin.clear();
		for (const bubble of shieldBubbles.values()) {
			bubble.destroy();
		}
		shieldBubbles.clear();
		for (const entity of viewers) {
			if (entity.sprite) entity.sprite.filters = null;
			entity.sprite?.destroy();
			entity.sprite = undefined;
			entity.plate?.destroy();
			entity.plate = undefined;
			entity.bar?.destroy();
			entity.bar = undefined;
			entity.view?.destroy();
			entity.view = undefined;
		}
		for (const shimmer of metalShimmers.values()) {
			shimmer.destroy();
		}
		metalShimmers.clear();
	};

	return system;
};
