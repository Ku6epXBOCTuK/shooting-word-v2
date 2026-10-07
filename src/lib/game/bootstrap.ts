import type { ChatMessage } from "#lib/chat/port.js";
import { createViewerStore } from "#lib/features/persistence/index.js";
import { World } from "miniplex";
import type { Application, Ticker } from "pixi.js";
import { loadAssets, SHIP_COUNT } from "./assets.js";
import {
	BULLET_HIT_DISTANCE,
	BULLET_SPEED,
	SHIELD_MAX_HP,
	VIEWER_GROUND_MARGIN,
	VIEWER_HEIGHT,
	VIEWER_SCALE,
	VIEWER_TIMEOUT_MS,
} from "./config.js";
import type { GameContext } from "./context.js";
import { spawnViewer } from "./spawn.js";
import { systemGroups } from "./systems/index.js";
import {
	SESSIONPHASE,
	type Entity,
	type SessionPhase,
	type ViewerIdentity,
} from "./types.js";

const MAX_FRAME_MS = 50;

export async function bootstrapGame(app: Application) {
	const assets = await loadAssets();

	const world = new World<Entity>();
	const viewers = world.with("viewer");
	const viewersWithPosition = world.with("viewer", "position");
	const wordsWithPosition = world.with("word", "position");
	const ctx: GameContext = {
		world,
		app,
		assets,
		viewerStore: createViewerStore(),
		viewersDirty: false,
	};

	const createGroups = () =>
		systemGroups().map((group) =>
			group.factories.map((factory) => factory(ctx)),
		);

	let groups = createGroups();

	const createSession = () =>
		world.add({
			session: { phase: SESSIONPHASE.IDLE as SessionPhase, timer: 0 },
		});
	let session = createSession();

	const restoreViewers = async () => {
		const now = Date.now();
		for (const viewer of await ctx.viewerStore.load()) {
			if (now - viewer.lastSeen < VIEWER_TIMEOUT_MS) {
				spawnViewer(world, viewer, app.screen, viewer.xp);
			}
		}
	};
	void restoreViewers();

	let timeScale = 1;
	let isDestroyed = false;

	const update = (ticker: Ticker) => {
		const dt = (Math.min(ticker.deltaMS, MAX_FRAME_MS) / 1000) * timeScale;
		for (const group of groups) {
			for (const system of group) {
				system(dt);
			}
		}
	};

	app.ticker.add(update);

	return {
		world,

		joinViewer: (identity: ViewerIdentity) => {
			for (const entity of viewers) {
				if (entity.viewer.userId === identity.userId) {
					entity.viewer.user = identity.user;
					entity.viewer.lastSeen = Date.now();
					ctx.viewersDirty = true;
					return;
				}
			}

			spawnViewer(
				world,
				{
					...identity,
					lastSeen: Date.now(),
					skin: Math.floor(Math.random() * SHIP_COUNT),
				},
				app.screen,
			);
			ctx.viewersDirty = true;
		},

		applyShields: (shields: { userId: string; expiresAt: number }[]) => {
			const map = new Map(
				shields.map((shield) => [shield.userId, shield.expiresAt]),
			);

			for (const entity of viewers) {
				const expiresAt = map.get(entity.viewer.userId);
				if (expiresAt === undefined) continue;

				if (!entity.shield) {
					world.addComponent(entity, "shield", {
						expiresAt,
						hp: SHIELD_MAX_HP,
					});
				} else if (entity.shield.expiresAt < expiresAt) {
					entity.shield.expiresAt = expiresAt;
				}
			}
		},

		changeSkin: (userId: string, skin?: number) => {
			for (const entity of viewers) {
				if (entity.viewer.userId !== userId) continue;

				const valid = skin !== undefined && skin >= 1 && skin <= SHIP_COUNT;
				entity.viewer.skin = valid
					? skin - 1
					: Math.floor(Math.random() * SHIP_COUNT);
				ctx.viewersDirty = true;
				return;
			}
		},

		shoot: (message: ChatMessage) => {
			const text = message.text.trim().toLowerCase();
			if (!text) return;

			const targets: Entity[] = [];
			for (const entity of wordsWithPosition) {
				if (entity.word.text.toLowerCase() === text) {
					targets.push(entity);
				}
			}
			if (targets.length === 0) return;

			let from: { x: number; y: number } | undefined;
			for (const entity of viewersWithPosition) {
				if (entity.viewer.userId === message.userId) {
					if (entity.dead) return;
					const halfHeight =
						(entity.size?.height ?? VIEWER_HEIGHT * VIEWER_SCALE) / 2;
					from = {
						x: entity.position.x,
						y: entity.position.y - halfHeight,
					};
					break;
				}
			}
			from ??= {
				x: app.screen.width / 2,
				y: app.screen.height - VIEWER_GROUND_MARGIN,
			};

			for (const target of targets) {
				world.add({
					bullet: { shooterId: message.userId },
					homing: {
						target,
						speed: BULLET_SPEED,
						hitDistance: BULLET_HIT_DISTANCE,
					},
					position: { x: from.x, y: from.y },
				});
			}
		},

		start() {
			if (isDestroyed) return;
			app.ticker.start();
		},

		stop() {
			app.ticker.stop();
		},

		isRunning() {
			return app.ticker.started;
		},

		startGame() {
			if (session.session.phase !== SESSIONPHASE.IDLE) return;
			session.session.phase = SESSIONPHASE.STARTING;
			session.session.timer = 0;
		},

		respawn(userId: string) {
			for (const entity of viewers) {
				if (entity.viewer.userId !== userId || !entity.dead) continue;

				world.removeComponent(entity, "dead");
				if (entity.hp) {
					entity.hp.current = entity.hp.max;
					entity.hp.regenIn = undefined;
				}
				ctx.viewersDirty = true;
				return;
			}
		},

		setTimeScale(scale: number) {
			timeScale = scale;
		},

		reset() {
			world.clear();

			for (const group of groups) {
				for (const system of group) {
					system.dispose?.();
				}
			}

			groups = createGroups();
			session = createSession();
			void restoreViewers();
			timeScale = 1;
		},

		destroy() {
			if (isDestroyed) return;
			isDestroyed = true;

			app.ticker?.remove(update);
			world.clear();

			for (const group of groups) {
				for (const system of group) {
					system.dispose?.();
				}
			}
		},
	};
}
