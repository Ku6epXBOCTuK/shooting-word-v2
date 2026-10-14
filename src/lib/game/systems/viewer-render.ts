import { AnimatedSprite, Graphics, Text, TextStyle } from "pixi.js";
import { createAura, createCoating } from "../../vfx/registry.js";
import { shieldHit } from "../../vfx/durations.js";
import { METAL_SHIMMER_MAX_SHIPS } from "../../vfx/shimmer.js";
import type {
	AuraStates,
	OverchargeAuraState,
	ShieldAuraState,
	VfxFilter,
	VfxStateful,
} from "../../vfx/types.js";
import {
	SHIELD_MAX_HP,
	VIEWER_LABEL_FONT_SIZE,
	VIEWER_PLATE_PADDING,
} from "../config.js";
import type { Entity, Position } from "../types.js";
import type { RenderSystemFactory, System } from "./types.js";

const LABEL_GAP = 4;
const SHIP_ANIMATION_SPEED = 0.2;
const PLATE_RADIUS = 6;
const PLATE_ALPHA = 0.7;
const HP_BAR_HEIGHT = 3;
const HP_BAR_GAP = 3;

type Positioned = Entity & { position: Position };

export const createViewerRenderSystem: RenderSystemFactory = (ctx) => {
	const viewers = ctx.world.with("viewer", "position");
	const labelStyle = new TextStyle({
		fill: "#ffffff",
		fontSize: VIEWER_LABEL_FONT_SIZE,
	});

	const appliedSkin = new Map<Entity, number>();
	const shields = new Map<Entity, VfxStateful<ShieldAuraState>>();
	const shimmers = new Map<Entity, VfxFilter>();

	const shipFrames = (skin: number) =>
		ctx.assets.ships[skin] ?? ctx.assets.ships[0];

	const placementOf = (entity: Positioned) => ({
		x: entity.position.x,
		y: entity.position.y,
		scale: ctx.settings.viewerScale,
	});

	const overcharges = new Map<Entity, VfxStateful<OverchargeAuraState>>();
	const auraStores = [shields, overcharges];

	/**
	 * Ауры, привязанные к компоненту зрителя: появляются вместе с компонентом,
	 * снимаются вместе с ним. Радиус всегда от размера спрайта, поэтому аура
	 * одинаково читается при любом `viewerScale`.
	 */
	const syncAura = <K extends "shield" | "overcharge">(
		entity: Positioned,
		ship: AnimatedSprite,
		visible: boolean,
		kind: K,
		active: boolean,
		state: AuraStates[K],
		store: Map<Entity, VfxStateful<AuraStates[K]>>,
	) => {
		if (!active) {
			const aura = store.get(entity);
			if (aura) {
				ctx.vfx.remove(aura);
				store.delete(entity);
			}
			return;
		}

		let aura = store.get(entity);
		if (!aura) {
			aura = createAura(kind, { ...placementOf(entity), rng: ctx.rng });
			if (!aura) return;
			store.set(entity, aura);
			ctx.vfx.add(aura, placementOf(entity));
		}

		aura.state = state;
		aura.root.visible = visible;
		ctx.vfx.move(aura, placementOf(entity));
	};

	const shipRadius = (ship: AnimatedSprite) =>
		Math.max(ship.width, ship.height) / 2;

	const syncEffects = (
		entity: Positioned,
		ship: AnimatedSprite,
		visible: boolean,
	) => {
		syncAura(
			entity,
			ship,
			visible,
			"shield",
			entity.shield !== undefined,
			{
				hp: entity.shield?.hp ?? 0,
				max: SHIELD_MAX_HP,
				radius: shipRadius(ship),
				...shieldHit(entity.shield ?? {}, entity.position, ctx.now()),
			},
			shields,
		);

		syncAura(
			entity,
			ship,
			visible,
			"overcharge",
			entity.overcharge !== undefined,
			{ radius: shipRadius(ship) },
			overcharges,
		);
	};

	const dropEffects = (entity: Entity, ship?: AnimatedSprite) => {
		for (const store of auraStores) {
			const aura = store.get(entity);
			if (aura) {
				ctx.vfx.remove(aura);
				store.delete(entity);
			}
		}
		if (shimmers.delete(entity) && ship) ctx.vfx.unfilter(ship);
	};

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
		dropEffects(entity, entity.sprite as AnimatedSprite | undefined);
		entity.sprite?.destroy();
		entity.sprite = undefined;
		appliedSkin.delete(entity);
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

			syncEffects(entity, ship, visible);

			if (entity.ricochetium && visible) {
				if (!shimmers.has(entity) && shimmers.size < METAL_SHIMMER_MAX_SHIPS) {
					const shimmer = createCoating("ricochetium");
					if (shimmer) {
						shimmers.set(entity, shimmer);
						ctx.vfx.filter(ship, shimmer);
					}
				}
			} else if (shimmers.has(entity)) {
				ctx.vfx.unfilter(ship);
				shimmers.delete(entity);
			}
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		appliedSkin.clear();
		for (const entity of viewers) {
			dropEffects(entity, entity.sprite as AnimatedSprite | undefined);
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
