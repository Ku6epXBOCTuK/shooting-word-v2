import { SHIELD_MAX_HP } from "#lib/game/config.ts";
import { Container, Graphics } from "pixi.js";
import type { VfxAura, VfxFrame } from "./types.js";

const OUTLINE_COLOR = 0x3fa9ff;
const RIM_COLOR = 0xcfeaff;
const GLOW_RINGS = 4;
const DOT_COUNT = 8;
const DOT_SPEED = 0.6;
const TWINKLE_SPEED = 2.5;
/** доля радиуса корабля */
const RADIUS_GAP = 0.5;
const RADIUS_BREATH = 0.09;
const GLOW_STEP = 0.25;
const BODY_ALPHA = 0.07;
const RIM_THICK = 0.0625;
const RIM_THICK_PER_CHARGE = 0.1875;
const RIM_INNER_THICK = 0.031;
const RIM_INNER_PER_CHARGE = 0.0625;
const DOT_MIN = 0.0625;
const DOT_SPAN = 0.0625;
const PIP_BELOW = 0.72;
const PIP_GAP = 0.5;
const PIP_RADIUS = 0.156;
const PIP_MIN_STROKE = 1;

export interface ShieldAuraState {
	/** сколько зарядов осталось */
	hp: number;
	/** сколько зарядов бывает всего */
	max: number;
	/** половина большей стороны корабля в мировых пикселях, уже с учётом масштаба */
	radius: number;
}

/**
 * Силовой щит. Все размеры — доли радиуса корабля, поэтому щит одинаково
 * читается при любом `viewerScale`.
 */
export function createShieldAura(): VfxAura<ShieldAuraState> {
	const body = new Graphics();
	const root = new Container();
	root.addChild(body);

	const aura: VfxAura<ShieldAuraState> = {
		root,
		state: { hp: SHIELD_MAX_HP, max: SHIELD_MAX_HP, radius: 0 },

		update(frame: VfxFrame) {
			const { hp, max, radius } = aura.state;
			body.clear();
			if (radius <= 0) return;

			const frac = max > 0 ? Math.max(0, hp / max) : 0;
			const px = (units: number) => Math.max(0.5, radius * units);
			const radiusNow =
				radius * (1 + RADIUS_GAP) +
				Math.sin(frame.t * 2 + frame.phase) * radius * RADIUS_BREATH;

			for (let i = GLOW_RINGS; i >= 1; i--) {
				body
					.circle(frame.x, frame.y, radiusNow + radius * GLOW_STEP * i)
					.fill({ color: OUTLINE_COLOR, alpha: 0.03 * frac });
			}

			body
				.circle(frame.x, frame.y, radiusNow)
				.fill({ color: OUTLINE_COLOR, alpha: BODY_ALPHA * frac })
				.circle(frame.x, frame.y, radiusNow)
				.stroke({
					color: OUTLINE_COLOR,
					alpha: 0.1 + 0.2 * frac,
					width: px(RIM_THICK + RIM_THICK_PER_CHARGE * frac),
				})
				.circle(frame.x, frame.y, radiusNow)
				.stroke({
					color: RIM_COLOR,
					alpha: 0.85 * frac,
					width: px(RIM_INNER_THICK + RIM_INNER_PER_CHARGE * frac),
				});

			for (let i = 0; i < DOT_COUNT; i++) {
				const angle =
					(i / DOT_COUNT) * Math.PI * 2 + frame.t * DOT_SPEED + frame.phase;
				const twinkle =
					0.4 +
					0.6 *
						Math.abs(Math.sin(frame.t * TWINKLE_SPEED + i * 1.7 + frame.phase));
				body
					.circle(
						frame.x + Math.cos(angle) * radiusNow,
						frame.y + Math.sin(angle) * radiusNow,
						px(DOT_MIN + DOT_SPAN * twinkle),
					)
					.fill({ color: RIM_COLOR, alpha: twinkle * frac });
			}

			const gap = radius * PIP_GAP;
			const dotY = frame.y + radiusNow * PIP_BELOW;
			const dotStartX = frame.x + radiusNow * PIP_BELOW - gap;
			for (let i = 0; i < max; i++) {
				const dotX = dotStartX + i * gap;
				if (i < hp) {
					body
						.circle(dotX, dotY, radius * PIP_RADIUS)
						.fill({ color: RIM_COLOR, alpha: 0.9 });
				} else {
					body.circle(dotX, dotY, radius * PIP_RADIUS).stroke({
						color: OUTLINE_COLOR,
						alpha: 0.4,
						width: Math.max(PIP_MIN_STROKE, radius * PIP_RADIUS * 0.4),
					});
				}
			}
		},

		destroy() {
			root.destroy();
		},
	};

	return aura;
}
