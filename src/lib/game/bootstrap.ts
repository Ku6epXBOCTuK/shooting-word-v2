import type { Application, Ticker } from "pixi.js";
import { World } from "miniplex";
import type { ChatMessage } from "#lib/chat/port.js";
import type { Entity, ViewerIdentity } from "./types.js";
import type { GameContext } from "./context.js";
import { systemGroups } from "./systems/index.js";
import { persistViewers } from "./persistence.js";
import { spawnViewer } from "./spawn.js";
import { loadAssets, SHIP_COUNT } from "./assets.js";
import { BULLET_SPEED, VIEWER_GROUND_MARGIN, VIEWER_HEIGHT } from "./config.js";

const MAX_FRAME_MS = 50;

export async function bootstrapGame(app: Application) {
	const assets = await loadAssets();

	const world = new World<Entity>();
	const ctx: GameContext = { world, app, assets };

	const createGroups = () =>
		systemGroups().map((group) =>
			group.factories.map((factory) => factory(ctx)),
		);

	let groups = createGroups();

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
			for (const entity of world.with("viewer")) {
				if (entity.viewer.userId === identity.userId) {
					entity.viewer.user = identity.user;
					entity.viewer.lastSeen = Date.now();
					persistViewers(world);
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
			persistViewers(world);
		},

		changeSkin: (userId: string, skin?: number) => {
			for (const entity of world.with("viewer")) {
				if (entity.viewer.userId !== userId) continue;

				const valid = skin !== undefined && skin >= 1 && skin <= SHIP_COUNT;
				entity.viewer.skin = valid
					? skin - 1
					: Math.floor(Math.random() * SHIP_COUNT);
				persistViewers(world);
				return;
			}
		},

		shoot: (message: ChatMessage) => {
			const text = message.text.trim().toLowerCase();
			if (!text) return;

			const targets: Entity[] = [];
			for (const entity of world.with("word", "position")) {
				if (entity.word.text.toLowerCase() === text) {
					targets.push(entity);
				}
			}
			if (targets.length === 0) return;

			let from: { x: number; y: number } | undefined;
			for (const entity of world.with("viewer", "position")) {
				if (entity.viewer.userId === message.userId) {
					from = {
						x: entity.position.x,
						y: entity.position.y - VIEWER_HEIGHT / 2,
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
					bullet: { target, speed: BULLET_SPEED, shooterId: message.userId },
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
