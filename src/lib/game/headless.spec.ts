import { expect, test } from "vitest";
import { createHeadlessGame } from "./headless.js";
import { defaultSettings } from "./settings.js";
import { SESSIONPHASE } from "./types.js";

test("headless game steps without pixi", () => {
	let now = 1_000_000;
	let seed = 42;
	const rng = () => {
		seed = (seed * 1103515245 + 12345) % 2147483648;
		return seed / 2147483648;
	};

	const game = createHeadlessGame({ now: () => now, rng });
	game.joinViewer({ userId: "u1", user: "alice" });
	game.startGame();

	for (let i = 0; i < 150; i++) {
		now += 100;
		game.step(0.1);
	}

	const session = [...game.world.with("session")][0];
	expect(session.session.phase).toBe(SESSIONPHASE.PLAYING);
	expect([...game.world.with("viewer")]).toHaveLength(1);
	expect([...game.world.with("word")].length).toBeGreaterThan(0);

	game.dispose();
});

test("misses disabled: unmatched shot does not fire", () => {
	const settings = defaultSettings();
	settings.viewerMisses = false;

	const game = createHeadlessGame({ settings });
	game.joinViewer({ userId: "u1", user: "alice" });

	game.shoot({
		channel: "c",
		userId: "u1",
		user: "alice",
		text: "неттакогослова",
		isMod: false,
	});

	expect([...game.world.with("bullet")]).toHaveLength(0);

	game.dispose();
});

test("missed shot flies to a random point and explodes", () => {
	let now = 1_000_000;
	let seed = 42;
	const rng = () => {
		seed = (seed * 1103515245 + 12345) % 2147483648;
		return seed / 2147483648;
	};

	const game = createHeadlessGame({ now: () => now, rng });
	game.joinViewer({ userId: "u1", user: "alice" });

	game.shoot({
		channel: "c",
		userId: "u1",
		user: "alice",
		text: "неттакогослова и ещё слова",
		isMod: false,
	});

	const bullets = [...game.world.with("bullet", "homing")];
	expect(bullets).toHaveLength(1);
	expect(bullets[0].bullet.miss).toBe(true);

	for (let i = 0; i < 100; i++) {
		now += 100;
		game.step(0.1);
		if ([...game.world.with("bullet")].length === 0) break;
	}

	expect([...game.world.with("bullet")]).toHaveLength(0);
	expect([...game.world.with("explosion")].length).toBeGreaterThan(0);
	expect([...game.world.with("hitBy")]).toHaveLength(0);
	expect([...game.world.with("viewer")][0].xp ?? 0).toBe(0);

	game.dispose();
});
