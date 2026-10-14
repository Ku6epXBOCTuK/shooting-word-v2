import type { Container } from "pixi.js";
import type { VfxFilter, VfxFrame, VfxItem, VfxPlacement } from "./types.js";

const PHASE_RATE = 0.013;

interface ChildEntry {
	effect: VfxItem;
	at: VfxPlacement;
}

export interface VfxLayer {
	readonly time: number;
	add(effect: VfxItem, at: VfxPlacement): void;
	move(effect: VfxItem, at: VfxPlacement): void;
	remove(effect: VfxItem): void;
	filter(target: Container, vfx: VfxFilter): void;
	unfilter(target: Container): void;
	update(dt: number): void;
	destroy(): void;
}

export function createVfxLayer(stage: Container): VfxLayer {
	const children: ChildEntry[] = [];
	const filters = new Map<Container, VfxFilter>();
	const frame: VfxFrame = { dt: 0, t: 0, x: 0, y: 0, scale: 1, phase: 0 };
	let time = 0;
	let destroyed = false;

	const find = (effect: VfxItem) =>
		children.find((entry) => entry.effect === effect);

	return {
		get time() {
			return time;
		},

		add(effect, at) {
			if (destroyed || find(effect)) return;
			children.push({ effect, at: { ...at } });
			stage.addChild(effect.root);
		},

		move(effect, at) {
			const entry = find(effect);
			if (!entry) return;
			entry.at.x = at.x;
			entry.at.y = at.y;
			entry.at.scale = at.scale;
		},

		remove(effect) {
			const index = children.findIndex((entry) => entry.effect === effect);
			if (index === -1) return;
			children.splice(index, 1);
			effect.root.destroy();
		},

		filter(target, vfx) {
			if (destroyed) return;
			const previous = filters.get(target);
			if (previous && previous !== vfx) previous.destroy();
			filters.set(target, vfx);
			target.filters = [vfx.filter];
		},

		unfilter(target) {
			const vfx = filters.get(target);
			if (!vfx) return;
			filters.delete(target);
			target.filters = null;
			vfx.destroy();
		},

		update(dt) {
			if (destroyed) return;
			time += dt;
			frame.dt = dt;
			frame.t = time;
			frame.x = 0;
			frame.y = 0;
			frame.scale = 1;
			frame.phase = 0;

			for (const { effect, at } of children) {
				frame.x = at.x;
				frame.y = at.y;
				frame.scale = at.scale;
				frame.phase = at.x * PHASE_RATE;
				effect.update(frame);
			}

			for (const vfx of filters.values()) {
				vfx.update(frame);
			}
		},

		destroy() {
			destroyed = true;
			for (const { effect } of children.splice(0)) {
				effect.root.destroy();
			}
			for (const vfx of filters.values()) {
				vfx.destroy();
			}
			filters.clear();
		},
	};
}
