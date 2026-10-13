import { SHIELD_MAX_HP } from "#lib/game/config.ts";
import { Graphics, type AnimatedSprite } from "pixi.js";

const SHIELD_DOT_RADIUS = 2.5;
const SHIELD_DOT_GAP = 8;

export function updateShieldBubble(
	bubble: Graphics,
	ship: AnimatedSprite,
	shieldHp: number,
	visible: boolean,
): void {
	bubble.visible = visible;

	const frac = Math.max(0, shieldHp / SHIELD_MAX_HP);
	const time = performance.now() / 1000;
	const phase = ship.x * 0.013;
	const radius =
		Math.max(ship.width, ship.height) / 2 +
		8 +
		Math.sin(time * 2 + phase) * 1.5;
	const x = ship.x;
	const y = ship.y;

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
		if (i < shieldHp) {
			bubble
				.circle(dotX, dotY, SHIELD_DOT_RADIUS)
				.fill({ color: 0xcfeaff, alpha: 0.9 });
		} else {
			bubble
				.circle(dotX, dotY, SHIELD_DOT_RADIUS)
				.stroke({ color: 0x3fa9ff, alpha: 0.4, width: 1 });
		}
	}
}
