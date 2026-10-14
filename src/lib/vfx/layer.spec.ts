import { describe, expect, test, vi } from "vitest";
import type { Container, Filter } from "pixi.js";
import { createVfxLayer } from "./layer.js";
import type { VfxFrame, VfxLayerItem, VfxPlacement } from "./types.js";

function fakeStage() {
	const children: unknown[] = [];
	return {
		children,
		addChild: vi.fn((child: unknown) => {
			children.push(child);
		}),
	};
}

function fakeEffect() {
	const frames: VfxFrame[] = [];
	const destroy = vi.fn();
	const effect = {
		root: { destroy } as unknown as Container,
		frames,
		update(frame: VfxFrame) {
			frames.push({ ...frame });
		},
		destroy,
	};
	return effect as VfxLayerItem & {
		frames: VfxFrame[];
		destroy: typeof destroy;
	};
}

function fakeFilter() {
	const frames: VfxFrame[] = [];
	return {
		frames,
		filter: { destroy: vi.fn() } as unknown as Filter,
		update(frame: VfxFrame) {
			frames.push({ ...frame });
		},
		destroy: vi.fn(),
	};
}

function fakeTarget() {
	return { filters: [] as unknown[] | null } as unknown as Container & {
		filters: unknown[] | null;
	};
}

const AT: VfxPlacement = { x: 100, y: 200, scale: 3 };

describe("vfx layer", () => {
	test("add parents the root and feeds placement into update", () => {
		const stage = fakeStage();
		const layer = createVfxLayer(stage as never);
		const effect = fakeEffect();

		layer.add(effect, AT);
		expect(stage.addChild).toHaveBeenCalledWith(effect.root);
		expect(stage.children).toHaveLength(1);

		layer.update(0.5);
		expect(effect.frames).toHaveLength(1);
		expect(effect.frames[0]).toMatchObject({
			x: 100,
			y: 200,
			scale: 3,
			dt: 0.5,
		});
	});

	test("time accumulates once per update and is readable", () => {
		const layer = createVfxLayer(fakeStage() as never);
		const effect = fakeEffect();
		layer.add(effect, AT);

		layer.update(0.25);
		layer.update(0.75);
		expect(layer.time).toBe(1);
		expect(effect.frames.map((frame) => frame.t)).toEqual([0.25, 1]);
	});

	test("phase is derived from the x position so neighbours desync", () => {
		const layer = createVfxLayer(fakeStage() as never);
		const left = fakeEffect();
		const right = fakeEffect();
		layer.add(left, { x: 0, y: 0, scale: 1 });
		layer.add(right, { x: 200, y: 0, scale: 1 });

		layer.update(0.1);
		expect(right.frames[0].phase).toBeGreaterThan(left.frames[0].phase);
	});

	test("move updates placement without reparenting", () => {
		const stage = fakeStage();
		const layer = createVfxLayer(stage as never);
		const effect = fakeEffect();
		layer.add(effect, AT);

		layer.move(effect, { x: 1, y: 2, scale: 1 });
		layer.update(0.1);

		expect(stage.addChild).toHaveBeenCalledTimes(1);
		expect(effect.frames[0]).toMatchObject({ x: 1, y: 2, scale: 1 });
	});

	test("remove destroys the root and stops updates", () => {
		const stage = fakeStage();
		const layer = createVfxLayer(stage as never);
		const effect = fakeEffect();
		layer.add(effect, AT);

		layer.remove(effect);
		expect(effect.destroy).toHaveBeenCalledTimes(1);

		layer.update(0.1);
		expect(effect.frames).toHaveLength(0);
	});

	test("adding the same effect twice is a no-op", () => {
		const stage = fakeStage();
		const layer = createVfxLayer(stage as never);
		const effect = fakeEffect();

		layer.add(effect, AT);
		layer.add(effect, AT);
		expect(stage.addChild).toHaveBeenCalledTimes(1);
	});

	test("filter is attached to the target and ticked with the layer", () => {
		const layer = createVfxLayer(fakeStage() as never);
		const target = fakeTarget();
		const vfx = fakeFilter();

		layer.filter(target, vfx);
		expect(target.filters).toEqual([vfx.filter]);

		layer.update(0.4);
		expect(vfx.frames).toHaveLength(1);
		expect(vfx.frames[0].t).toBe(0.4);
	});

	test("unfilter clears the target and destroys the effect", () => {
		const layer = createVfxLayer(fakeStage() as never);
		const target = fakeTarget();
		const vfx = fakeFilter();
		layer.filter(target, vfx);

		layer.unfilter(target);
		expect(target.filters).toBeNull();
		expect(vfx.destroy).toHaveBeenCalledTimes(1);

		layer.update(0.1);
		expect(vfx.frames).toHaveLength(0);
	});

	test("destroy tears down every child and filter and ignores later calls", () => {
		const stage = fakeStage();
		const layer = createVfxLayer(stage as never);
		const effect = fakeEffect();
		const target = fakeTarget();
		const vfx = fakeFilter();
		layer.add(effect, AT);
		layer.filter(target, vfx);

		layer.destroy();
		expect(effect.destroy).toHaveBeenCalledTimes(1);
		expect(vfx.destroy).toHaveBeenCalledTimes(1);

		const late = fakeEffect();
		layer.add(late, AT);
		layer.update(0.1);
		layer.destroy();
		expect(late.destroy).not.toHaveBeenCalled();
		expect(late.frames).toHaveLength(0);
	});
});
