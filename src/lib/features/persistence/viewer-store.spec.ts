import { describe, expect, it, vi } from "vitest";
import {
	mergeProfile,
	ViewerStore,
	type StoredViewer,
} from "./viewer-store.js";

const viewer = (overrides: Partial<StoredViewer> = {}): StoredViewer => ({
	userId: "u1",
	user: "alice",
	login: "alice",
	lastSeen: 1_000_000,
	skin: 3,
	xp: 5,
	batteries: 2,
	revives: 1,
	beacons: 0,
	...overrides,
});

describe("ViewerStore", () => {
	it("does not write before the initial load finished", async () => {
		let release: (value: unknown) => void = () => {};
		const load = vi.fn(
			() =>
				new Promise((resolve) => {
					release = resolve;
				}),
		);
		const save = vi.fn(() => Promise.resolve());
		const store = new ViewerStore({ load, save });

		const pending = store.save([viewer()]);
		await Promise.resolve();
		expect(save).not.toHaveBeenCalled();

		release(null);
		await pending;
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("reads the storage once for repeated loads", async () => {
		const load = vi.fn(() => Promise.resolve([viewer()]));
		const store = new ViewerStore({ load, save: vi.fn() });

		const [a, b] = await Promise.all([store.load(), store.load()]);

		expect(load).toHaveBeenCalledTimes(1);
		expect(a).toEqual(b);
	});

	it("drops malformed entries and fills missing counters", async () => {
		const store = new ViewerStore({
			load: () =>
				Promise.resolve([
					{ userId: "u1", user: "a", login: "a", lastSeen: 1 },
					"junk",
					null,
				]),
			save: vi.fn(),
		});

		const loaded = await store.load();

		expect(loaded).toEqual([
			{
				userId: "u1",
				user: "a",
				login: "a",
				lastSeen: 1,
				xp: 0,
				batteries: 0,
				revives: 0,
				beacons: 0,
				skin: 0,
			},
		]);
	});
});

describe("mergeProfile", () => {
	it("keeps the stored version when nothing changed", () => {
		const prev = viewer({ updatedAt: 42 });

		expect(mergeProfile(prev, viewer(), 99)).toBe(prev);
	});

	it("marks changed content with the new version", () => {
		const prev = viewer({ updatedAt: 42, batteries: 1 });

		expect(mergeProfile(prev, viewer({ batteries: 2 }), 99)).toEqual({
			...viewer({ batteries: 2 }),
			updatedAt: 99,
		});
	});
});
