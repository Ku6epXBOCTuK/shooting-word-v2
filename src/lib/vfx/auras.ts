import { Container, Graphics } from "pixi.js";
import type {
	DoomsdayAuraState,
	OverchargeAuraState,
	PortalAuraState,
	VfxFrame,
	VfxItem,
	VfxStateful,
} from "./types.js";

const CORE_RADIUS = 72;
const CORE_COLOR = 0xff3322;
const AURA_COLOR = 0xff2211;
const AURA_GAP = 0.4;
const CORE_PULSE = 6;

export function createDoomsdayAura(): VfxStateful<DoomsdayAuraState> {
	const body = new Graphics();
	const root = new Container();
	root.addChild(body);

	const aura: VfxStateful<DoomsdayAuraState> = {
		root,
		state: {
			active: false,
			shooter: null,
			shooterRadius: 0,
		},

		update(frame: VfxFrame) {
			const { active, shooter, shooterRadius } = aura.state;
			body.clear();

			const pulse = 0.5 + 0.5 * Math.sin(frame.t * CORE_PULSE);

			// NOTE: the core is drawn at the placement, the ring at the shooter ship
			// tracked in state, so the two can sit on different ships.
			if (shooter) {
				body
					.circle(
						shooter.x,
						shooter.y,
						shooterRadius * (1 + AURA_GAP) + pulse * 4,
					)
					.stroke({
						color: AURA_COLOR,
						alpha: 0.4 + 0.3 * pulse,
						width: 3,
					});
			}

			if (!active) return;

			body
				.circle(frame.x, frame.y, CORE_RADIUS * (0.8 + 0.4 * pulse))
				.fill({ color: CORE_COLOR, alpha: 0.25 + 0.2 * pulse })
				.circle(frame.x, frame.y, CORE_RADIUS * 0.4)
				.fill({ color: CORE_COLOR, alpha: 0.6 });
		},

		destroy() {
			root.destroy();
		},
	};

	return aura;
}

export function createDoomsdayBolt(radius: number): VfxItem {
	const body = new Graphics().circle(0, 0, radius).fill(0xff3322);
	const root = new Container();
	root.addChild(body);

	return {
		root,
		update(frame: VfxFrame) {
			body.x = frame.x;
			body.y = frame.y;
		},
		destroy() {
			root.destroy();
		},
	};
}

const OVERCHARGE_COLOR = 0xffb020;
const OVERCHARGE_HOT = 0xffe6a0;
const OVERCHARGE_ARCS = 6;
const OVERCHARGE_SPAN = 0.8;
const OVERCHARGE_WIDTH = 0.08;
const OVERCHARGE_SPEED = 1.6;
const OVERCHARGE_PULSE = 5;

export function createOverchargeAura(): VfxStateful<OverchargeAuraState> {
	const body = new Graphics();
	const root = new Container();
	root.addChild(body);

	const aura: VfxStateful<OverchargeAuraState> = {
		root,
		state: { radius: 0 },

		update(frame: VfxFrame) {
			const { radius } = aura.state;
			body.clear();
			if (radius <= 0) return;

			const px = (units: number) => Math.max(1, radius * units);
			const pulse = 0.5 + 0.5 * Math.sin(frame.t * OVERCHARGE_PULSE);
			const ring = radius * (1 + OVERCHARGE_SPAN) + pulse * radius * 0.08;
			const step = (Math.PI * 2) / OVERCHARGE_ARCS;
			const turn = frame.t * OVERCHARGE_SPEED + frame.phase;

			for (let i = 0; i < OVERCHARGE_ARCS; i++) {
				const start = turn + i * step;
				body.arc(frame.x, frame.y, ring, start, start + step * 0.62).stroke({
					color: OVERCHARGE_HOT,
					alpha: 0.35 + 0.45 * pulse,
					width: px(OVERCHARGE_WIDTH),
					cap: "round",
				});
			}

			body.circle(frame.x, frame.y, ring * 0.94).stroke({
				color: OVERCHARGE_COLOR,
				alpha: 0.25 + 0.2 * pulse,
				width: px(0.03),
			});
		},

		destroy() {
			root.destroy();
		},
	};

	return aura;
}

const PORTAL_RADIUS = 32;
const PORTAL_COLOR = 0x9b59ff;
const PORTAL_EDGE = 0xd6b3ff;
const BAR_WIDTH = 48;
const BAR_HEIGHT = 4;
const BAR_GAP = 8;
const PORTAL_PULSE = 4;

export function createPortalAura(): VfxStateful<PortalAuraState> {
	const body = new Graphics();
	const root = new Container();
	root.addChild(body);

	const aura: VfxStateful<PortalAuraState> = {
		root,
		state: { progress: 0, groundY: 0 },

		update(frame: VfxFrame) {
			// NOTE: the host supplies groundY because the ground line depends on the
			// viewer height, which the effect cannot know.
			const { progress, groundY } = aura.state;
			const pulse = 0.5 + 0.5 * Math.sin(frame.t * PORTAL_PULSE);

			body
				.ellipse(frame.x, frame.y, PORTAL_RADIUS * 0.6, PORTAL_RADIUS)
				.fill({ color: PORTAL_COLOR, alpha: 0.25 + 0.2 * pulse })
				.ellipse(frame.x, frame.y, PORTAL_RADIUS * 0.6, PORTAL_RADIUS)
				.stroke({
					color: PORTAL_EDGE,
					alpha: 0.6 + 0.3 * pulse,
					width: 2,
				});

			body
				.rect(frame.x - BAR_WIDTH / 2, groundY + BAR_GAP, BAR_WIDTH, BAR_HEIGHT)
				.fill({ color: 0x000000, alpha: 0.5 })
				.rect(
					frame.x - BAR_WIDTH / 2,
					groundY + BAR_GAP,
					BAR_WIDTH * progress,
					BAR_HEIGHT,
				)
				.fill(PORTAL_COLOR);
		},

		destroy() {
			root.destroy();
		},
	};

	return aura;
}
