import { expect, test } from "vitest";
import { createHeadlessGame } from "../headless.js";
import { SESSIONPHASE } from "../types.js";

function mulberry32(seed: number) {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

test("perf: 10 min of PLAYING with 10 instant-typing bots", () => {
	let now = 1_000_000;
	const rng = mulberry32(42);
	const game = createHeadlessGame({ now: () => now, rng });

	for (let i = 0; i < 10; i++) {
		game.joinViewer({ userId: `u${i}`, user: `bot${i}` });
	}
	game.startGame();

	const DT = 0.1;
	const STEPS = 6000;

	const started = performance.now();
	let shots = 0;

	for (let step = 0; step < STEPS; step++) {
		now += DT * 1000;

		const session = [...game.world.with("session")][0];
		if (session.session.phase === SESSIONPHASE.PLAYING) {
			const words = [...game.world.with("word", "position")];
			if (words.length > 0) {
				for (const viewer of game.world.with("viewer")) {
					if (viewer.dead) continue;
					game.shoot({
						channel: "test",
						userId: viewer.viewer.userId,
						user: viewer.viewer.user,
						text: words[0].word.text,
						isMod: false,
					});
					shots++;
				}
			}
		}

		game.step(DT);
	}

	const elapsed = performance.now() - started;
	const entities = game.world.entities.length;
	process.stdout.write(
		`\n[perf] 10min sim: ${Math.round(elapsed)}ms, ${shots} shots, ${entities} entities alive, ${(elapsed / STEPS).toFixed(3)}ms/step\n`,
	);
	expect(elapsed).toBeGreaterThan(0);

	game.dispose();
}, 120_000);
