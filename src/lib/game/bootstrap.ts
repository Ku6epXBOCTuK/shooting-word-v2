import type { Application, Ticker } from "pixi.js";
import { World } from "miniplex";
import type { Entity, Viewer } from "./types.js";
import type { GameContext } from "./context.js";
import { systemGroups } from "./systems/index.js";
import {
	VIEWER_WIDTH,
	WALK_MAX_SPEED,
	WALK_MAX_TURN_TIME,
	WALK_MIN_SPEED,
} from "./config.js";

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

		joinViewer: (viewer: Viewer) => {
			for (const entity of world.with("viewer")) {
				if (entity.viewer.userId === viewer.userId) return;
			}

			const halfWidth = VIEWER_WIDTH / 2;
			const x =
				halfWidth +
				Math.random() * Math.max(1, app.screen.width - VIEWER_WIDTH);

			world.add({
				viewer,
				position: { x, y: 0 },
				walker: {
					direction: Math.random() < 0.5 ? -1 : 1,
					speed:
						WALK_MIN_SPEED + Math.random() * (WALK_MAX_SPEED - WALK_MIN_SPEED),
					timer: Math.random() * WALK_MAX_TURN_TIME,
				},
			});
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
