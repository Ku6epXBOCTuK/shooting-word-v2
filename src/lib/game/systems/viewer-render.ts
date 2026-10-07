import { AnimatedSprite, Graphics, Text, TextStyle } from "pixi.js";
import { SHIELD_MAX_HP, VIEWER_PLATE_PADDING } from "../config.js";
import type { Entity } from "../types.js";
import type { System, SystemFactory } from "./types.js";

const LABEL_GAP = 4;
const SHIP_ANIMATION_SPEED = 0.2;
const PLATE_RADIUS = 6;
const PLATE_ALPHA = 0.7;
const HP_BAR_HEIGHT = 3;
const HP_BAR_GAP = 3;
const SHIELD_DOT_RADIUS = 2.5;
const SHIELD_DOT_GAP = 8;

export const createViewerRenderSystem: SystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer", "position");
	const labelStyle = new TextStyle({ fill: "#ffffff", fontSize: 12 });

	const appliedSkin = new Map<Entity, number>();
	const shieldBubbles = new Map<Entity, Graphics>();

	const shipFrames = (skin: number) =>
		ctx.assets.ships[skin] ?? ctx.assets.ships[0];

	const unsubscribeAdded = viewers.onEntityAdded.subscribe((entity) => {
		const plate = new Graphics();
		entity.plate = plate;

		const bar = new Graphics();
		entity.bar = bar;

		const ship = new AnimatedSprite(shipFrames(entity.viewer.skin));
		ship.anchor.set(0.5);
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

				const frac = Math.max(0, entity.shield.hp / SHIELD_MAX_HP);
				const time = performance.now() / 1000;
				const phase = entity.position.x * 0.013;
				const radius =
					Math.max(ship.width, ship.height) / 2 +
					8 +
					Math.sin(time * 2 + phase) * 1.5;
				const { x, y } = entity.position;

				bubble.clear();

				for (let i = 4; i >= 1; i--) {
					bubble
						.circle(x, y, radius + i * 4)
						.fill({ color: 0x3fa9ff, alpha: 0.03 * frac });
				}

				bubble
					.circle(x, y, radius)
					.fill({ color: 0x3fa9ff, alpha: 0.07 * frac })
					.circle(x, y, radius)
					.stroke({
						color: 0x3fa9ff,
						alpha: 0.1 + 0.2 * frac,
						width: 1 + 3 * frac,
					})
					.circle(x, y, radius)
					.stroke({
						color: 0xcfeaff,
						alpha: 0.85 * frac,
						width: 0.5 + frac,
					});

				for (let i = 0; i < 8; i++) {
					const angle = (i / 8) * Math.PI * 2 + time * 0.6 + phase;
					const twinkle =
						0.4 + 0.6 * Math.abs(Math.sin(time * 2.5 + i * 1.7 + phase));
					bubble
						.circle(
							x + Math.cos(angle) * radius,
							y + Math.sin(angle) * radius,
							1 + twinkle,
						)
						.fill({ color: 0xcfeaff, alpha: twinkle * frac });
				}

				const dotY = y + radius * 0.72;
				const dotStartX = x + radius * 0.72 - SHIELD_DOT_GAP;
				for (let i = 0; i < SHIELD_MAX_HP; i++) {
					const dotX = dotStartX + i * SHIELD_DOT_GAP;
					if (i < entity.shield.hp) {
						bubble
							.circle(dotX, dotY, SHIELD_DOT_RADIUS)
							.fill({ color: 0xcfeaff, alpha: 0.9 });
					} else {
						bubble
							.circle(dotX, dotY, SHIELD_DOT_RADIUS)
							.stroke({ color: 0x3fa9ff, alpha: 0.4, width: 1 });
					}
				}
			} else if (bubble) {
				bubble.destroy();
				shieldBubbles.delete(entity);
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
			entity.sprite?.destroy();
			entity.sprite = undefined;
			entity.plate?.destroy();
			entity.plate = undefined;
			entity.bar?.destroy();
			entity.bar = undefined;
			entity.view?.destroy();
			entity.view = undefined;
		}
	};

	return system;
};
