import type { Application, Ticker } from "pixi.js";
import { World } from "miniplex";
import type { Entity, ViewerIdentity } from "./types.js";
import type { GameContext } from "./context.js";
import { systemGroups } from "./systems/index.js";
import { persistViewers } from "./persistence.js";
import { spawnViewer } from "./spawn.js";

const MAX_FRAME_MS = 50;

export function bootstrapGame(app: Application) {
	const world = new World<Entity>();
	const ctx: GameContext = { world, app };

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

			spawnViewer(world, { ...identity, lastSeen: Date.now() }, app.screen);
			persistViewers(world);
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
