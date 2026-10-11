import { expect, test } from "vitest";
import { mulberry32 } from "./balance/sim.js";
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
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
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
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });

	game.shoot({
		channel: "c",
		userId: "u1",
		user: "alice",
		login: "alice",
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
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });

	game.shoot({
		channel: "c",
		userId: "u1",
		user: "alice",
		login: "alice",
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

	const session = [...game.world.with("session", "roundStats")][0];
	expect(session.roundStats.misses.u1).toEqual({ user: "alice", count: 1 });

	game.dispose();
});

test("doomsday freezes words, destroys them and cleans up", () => {
	let now = 1_000_000;
	let seed = 42;
	const rng = () => {
		seed = (seed * 1103515245 + 12345) % 2147483648;
		return seed / 2147483648;
	};

	const game = createHeadlessGame({ now: () => now, rng });
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.startGame();

	for (let i = 0; i < 150; i++) {
		now += 100;
		game.step(0.1);
	}

	expect([...game.world.with("word")].length).toBeGreaterThan(0);

	game.doomsday("u1");

	for (const word of game.world.with("word")) {
		expect(word.doomsdayed).toBe(true);
	}
	expect([...game.world.with("doomsday")]).toHaveLength(1);
	expect([...game.world.with("doomsdayBolt")]).toHaveLength(1);

	const isActive = () =>
		[...game.world.with("doomsday")][0]?.doomsday.active ?? false;
	for (let i = 0; i < 50 && !isActive(); i++) {
		now += 100;
		game.step(0.1);
	}
	expect(isActive()).toBe(true);

	const frozen = [...game.world.with("word", "lifetime")][0];
	if (frozen) {
		const age = frozen.lifetime.age;
		now += 100;
		game.step(0.1);
		if (game.world.has(frozen)) {
			expect(frozen.lifetime.age).toBe(age);
		}
	}

	for (let i = 0; i < 300; i++) {
		now += 100;
		game.step(0.1);
	}

	expect([...game.world.with("doomsday")]).toHaveLength(0);
	expect([...game.world.with("doomsdayed")]).toHaveLength(0);

	const session = [...game.world.with("session", "roundStats")][0];
	expect(session.roundStats.doomsday.u1.count).toBeGreaterThan(0);
	expect(session.roundStats.kills.u1).toBeUndefined();

	game.dispose();
});

test("doomsday rejected for dead viewer or while device active", () => {
	let now = 1_000_000;
	let seed = 42;
	const rng = () => {
		seed = (seed * 1103515245 + 12345) % 2147483648;
		return seed / 2147483648;
	};

	const game = createHeadlessGame({ now: () => now, rng });
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.joinViewer({ userId: "u2", user: "bob", login: "bob" });
	game.startGame();

	for (let i = 0; i < 150; i++) {
		now += 100;
		game.step(0.1);
	}

	const dead = [...game.world.with("viewer")].find(
		(entity) => entity.viewer.userId === "u1",
	);
	expect(dead).toBeDefined();
	game.world.addComponent(dead!, "dead", true);

	expect(game.doomsday("u1")).toBe(false);
	expect([...game.world.with("doomsday")]).toHaveLength(0);
	expect([...game.world.with("doomsdayed")]).toHaveLength(0);

	expect(game.doomsday("u2")).toBe(true);
	expect(game.doomsday("u2")).toBe(false);
	expect([...game.world.with("doomsday")]).toHaveLength(1);

	game.dispose();
});

test("time stop freezes word ttl for its duration", () => {
	let now = 1_000_000;
	let seed = 42;
	const rng = () => {
		seed = (seed * 1103515245 + 12345) % 2147483648;
		return seed / 2147483648;
	};

	const game = createHeadlessGame({ now: () => now, rng });
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.startGame();

	for (let i = 0; i < 150; i++) {
		now += 100;
		game.step(0.1);
	}

	const word = [...game.world.with("word", "lifetime")].find(
		(entity) => !entity.timedOut,
	);
	if (!word) throw new Error("no live word spawned");

	game.timeStop();
	game.timeStop();
	expect([...game.world.with("timeStop")]).toHaveLength(1);

	const age = word.lifetime.age;
	for (let i = 0; i < 50; i++) {
		now += 100;
		game.step(0.1);
	}
	expect(word.lifetime.age).toBe(age);
	expect([...game.world.with("timeStop")]).toHaveLength(1);

	for (let i = 0; i < 70 && [...game.world.with("timeStop")].length > 0; i++) {
		now += 100;
		game.step(0.1);
	}
	expect([...game.world.with("timeStop")]).toHaveLength(0);

	if (game.world.has(word) && !word.timedOut) {
		const resumed = word.lifetime.age;
		now += 100;
		game.step(0.1);
		expect(word.lifetime.age).toBeGreaterThan(resumed);
	}

	game.dispose();
});

test("repair resolves @login to userId even when displayName differs", () => {
	const game = createHeadlessGame({});
	game.joinViewer({ userId: "u1", user: "Alice", login: "alice" });
	game.joinViewer({ userId: "u2", user: "소피아", login: "sophia_kr" });

	const target = [...game.world.with("viewer")].find(
		(entity) => entity.viewer.userId === "u2",
	);
	if (!target?.hp) throw new Error("target viewer missing");
	target.hp.current = 1;
	game.grantBatteries(["u1"]);

	expect(game.repair("u1", "Sophia_KR")).toBe(true);
	expect(target.hp.current).toBeGreaterThan(1);
	expect(
		[...game.world.with("viewer")].find(
			(entity) => entity.viewer.userId === "u1",
		)?.batteries,
	).toBe(0);

	game.dispose();
});

test("battery heals less on self than on another viewer", () => {
	const settings = {
		...defaultSettings(),
		batteryHeal: 2,
		batteryHealOther: 5,
	};
	const game = createHeadlessGame({ settings });
	game.joinViewer({ userId: "u1", user: "Alice", login: "alice" });
	game.joinViewer({ userId: "u2", user: "Bob", login: "bob" });

	const hpOf = (userId: string) => {
		const entity = [...game.world.with("viewer")].find(
			(candidate) => candidate.viewer.userId === userId,
		);
		if (!entity?.hp) throw new Error(`viewer ${userId} missing`);
		return entity.hp;
	};

	const healerHp = hpOf("u1");
	healerHp.current = 1;
	game.grantBatteries(["u1"]);
	expect(game.repair("u1")).toBe(true);
	expect(healerHp.current).toBe(3);

	const targetHp = hpOf("u2");
	targetHp.current = 1;
	game.grantBatteries(["u1"]);
	expect(game.repair("u1", "bob")).toBe(true);
	expect(targetHp.current).toBe(6);

	game.dispose();
});

test("overcharge shoots every unique word of the message until expiry", () => {
	let now = 1_000_000;
	const game = createHeadlessGame({ now: () => now });
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });

	const shoot = (text: string) =>
		game.shoot({
			channel: "c",
			userId: "u1",
			user: "alice",
			login: "alice",
			text,
			isMod: false,
		});
	const bulletCount = () => [...game.world.with("bullet")].length;

	shoot("раз два");
	expect(bulletCount()).toBe(1);

	game.applyOvercharges([{ userId: "u1", expiresAt: now + 120_000 }]);

	shoot("раз два два три");
	expect(bulletCount()).toBe(1 + 3);

	now += 121_000;
	game.step(0.1);

	shoot("раз два");
	expect(bulletCount()).toBe(4 + 1);

	game.dispose();
});

test("ricochetium halves enemy damage chance until expiry", () => {
	const settings = defaultSettings();
	settings.viewerBaseHp = 1000;

	const runShots = (coated: boolean) => {
		let now = 1_000_000;
		const rng = mulberry32(777);
		const game = createHeadlessGame({ now: () => now, rng, settings });
		game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
		if (coated) {
			game.applyRicochetiums([{ userId: "u1", expiresAt: now + 300_000 }]);
		}
		game.startGame();

		let shots = 0;
		let hits = 0;
		game.world.with("enemyShot").onEntityAdded.subscribe((entity) => {
			shots++;
			if (entity.enemyShot.damage > 0) hits++;
		});

		let coatedDuringRun = 0;
		for (let i = 0; i < 6000; i++) {
			now += 100;
			game.step(0.1);
			if (i === 100) {
				coatedDuringRun = [...game.world.with("ricochetium")].length;
			}
		}

		const coatedLeft = [...game.world.with("ricochetium")].length;
		game.dispose();
		return { shots, hits, coatedDuringRun, coatedLeft };
	};

	const plain = runShots(false);
	const coated = runShots(true);

	expect(plain.shots).toBeGreaterThan(10);
	expect(coated.shots).toBe(plain.shots);
	expect(coated.hits).toBeLessThan(plain.hits);
	expect(coated.coatedDuringRun).toBe(1);
	expect(coated.coatedLeft).toBe(0);
	expect(plain.coatedDuringRun).toBe(0);
});

test("repair with unknown nick fails without spending a battery", () => {
	const game = createHeadlessGame({});
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });

	const healer = [...game.world.with("viewer")][0];
	if (!healer.hp) throw new Error("healer viewer missing");
	healer.hp.current = 1;
	game.grantBatteries(["u1"]);

	expect(game.repair("u1", "ghost")).toBe(false);
	expect(healer.batteries).toBe(1);
	expect(healer.hp.current).toBe(1);

	game.dispose();
});

const startPlaying = () => {
	let now = 1_000_000;
	const game = createHeadlessGame({ now: () => now });
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.joinViewer({ userId: "u2", user: "소피아", login: "sophia_kr" });
	game.startGame();
	for (let i = 0; i < 150; i++) {
		now += 100;
		game.step(0.1);
	}
	const target = [...game.world.with("viewer")].find(
		(entity) => entity.viewer.userId === "u2",
	);
	if (!target) throw new Error("target viewer missing");
	return {
		game,
		target,
		tick: (seconds: number) => {
			for (let i = 0; i < seconds * 10; i++) {
				now += 100;
				game.step(0.1);
			}
		},
	};
};

test("round reset revives the fleet but keeps buffs and progress", () => {
	let now = 1_000_000;
	const game = createHeadlessGame({ now: () => now });
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });

	const tick = (seconds: number) => {
		for (let i = 0; i < seconds * 10; i++) {
			now += 100;
			game.step(0.1);
		}
	};

	tick(1);

	const alice = [...game.world.with("viewer")][0];
	if (!alice.hp || !alice.position) throw new Error("viewer missing");
	alice.hp.current = 1;
	game.world.addComponent(alice, "dead", true);
	game.world.addComponent(alice, "respawning", {
		elapsed: 0,
		duration: 10,
		x: 100,
	});
	game.grantBatteries(["u1"]);
	game.grantBeacons(["u1"]);
	game.applyShields([{ userId: "u1", expiresAt: now + 600_000 }]);
	game.applyOvercharges([{ userId: "u1", expiresAt: now + 120_000 }]);
	game.applyRicochetiums([{ userId: "u1", expiresAt: now + 300_000 }]);

	const before = alice.position.x;
	const shieldUntil = now + 600_000;
	const overchargeUntil = now + 120_000;
	const ricochetiumUntil = now + 300_000;
	game.startGame();
	tick(1);

	const after = [...game.world.with("viewer")][0];
	if (!after.position) throw new Error("viewer missing");
	expect(after).toBe(alice);
	expect(after.dead).toBeUndefined();
	expect(after.respawning).toBeUndefined();
	expect(after.hp?.current).toBe(after.hp?.max);
	expect(after.batteries).toBe(1);
	expect(after.beacons).toBe(1);
	expect(after.shield?.expiresAt).toBe(shieldUntil);
	expect(after.overcharge?.expiresAt).toBe(overchargeUntil);
	expect(after.ricochetium?.expiresAt).toBe(ricochetiumUntil);
	expect(after.position.x).not.toBe(before);

	game.dispose();
});

test("remote revive returns a dead viewer after 5 seconds", () => {
	const { game, target, tick } = startPlaying();
	game.world.addComponent(target, "dead", true);
	game.grantBeacons(["u1"]);

	expect(game.remoteRevive("u1", "Sophia_KR")).toBe(true);
	expect(target.respawning?.duration).toBe(5);
	expect(
		[...game.world.with("viewer")].find(
			(entity) => entity.viewer.userId === "u1",
		)?.beacons,
	).toBe(0);

	tick(6);
	expect(target.dead).toBeUndefined();
	expect(target.hp?.current).toBe(target.hp?.max);

	game.dispose();
});

test("remote revive fails without spending a beacon", () => {
	const { game, target } = startPlaying();
	game.world.addComponent(target, "dead", true);

	expect(game.remoteRevive("u1", "sophia_kr")).toBe(false);

	game.grantBeacons(["u1"]);
	expect(game.remoteRevive("u1", "ghost")).toBe(false);
	expect(game.remoteRevive("u1", "alice")).toBe(false);
	expect(
		[...game.world.with("viewer")].find(
			(entity) => entity.viewer.userId === "u1",
		)?.beacons,
	).toBe(1);
	expect(target.respawning).toBeUndefined();

	game.dispose();
});

test("remote revive only works during a round", () => {
	const game = createHeadlessGame({});
	game.joinViewer({ userId: "u1", user: "alice", login: "alice" });
	game.joinViewer({ userId: "u2", user: "bob", login: "bob" });

	const target = [...game.world.with("viewer")].find(
		(entity) => entity.viewer.userId === "u2",
	);
	if (!target) throw new Error("target viewer missing");
	game.world.addComponent(target, "dead", true);
	game.grantBeacons(["u1"]);

	expect(game.remoteRevive("u1", "bob")).toBe(false);
	expect(target.respawning).toBeUndefined();

	game.dispose();
});
