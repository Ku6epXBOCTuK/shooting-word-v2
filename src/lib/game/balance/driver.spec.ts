import { expect, test } from "vitest";
import {
	DEFAULT_DRIVER_PARAMS,
	runDriver,
	type DriverParams,
} from "./driver.js";

const base: Omit<DriverParams, "seed"> = {
	activePlayers: 10,
	passivePlayers: 20,
	...DEFAULT_DRIVER_PARAMS,
};

test("deterministic: same seed - same stats", () => {
	const a = runDriver({ ...base, seed: 7 });
	const b = runDriver({ ...base, seed: 7 });
	expect(a).toEqual(b);
});

test("active bots keep words under control", () => {
	const stats = runDriver({ ...base, seed: 3 });
	expect(stats.wordsSpawned).toBeGreaterThan(0);
	expect(stats.wordsKilled).toBeGreaterThan(0);
	expect(stats.wipeSec).toBeNull();
});

test("passive lobby with max damage wipes", () => {
	const stats = runDriver({
		...base,
		activePlayers: 0,
		passivePlayers: 5,
		settings: { enemyDamageChance: 1 },
		seed: 5,
	});
	expect(stats.wipeSec).not.toBeNull();
	expect(stats.deaths).toBe(5);
});
