import { expect, test } from "vitest";
import { createHeadlessGame } from "./headless.js";
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
