import type { Application, Ticker } from "pixi.js";
import { World } from "miniplex";
import type { ChatMessage } from "#lib/chat/port.js";
import type { Entity } from "./types.js";
import type { GameContext } from "./context.js";
import { systemGroups } from "./systems/index.js";

const MAX_FRAME_MS = 50;

export function bootstrapGame(app: Application) {
	const world = new World<Entity>();
	const spawnQueue: ChatMessage[] = [];
	const ctx: GameContext = { world, app, spawnQueue };

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

		spawnWord: (message: ChatMessage) => {
			spawnQueue.push(message);
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
			spawnQueue.length = 0;

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

			app.ticker.remove(update);
			world.clear();

			for (const group of groups) {
				for (const system of group) {
					system.dispose?.();
				}
			}
		},
	};
}
