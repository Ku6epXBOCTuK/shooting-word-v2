import { createViewerStore } from "#lib/features/persistence/index.js";
import { Text, TextStyle, type Application, type Ticker } from "pixi.js";
import { loadAssets } from "./assets.js";
import { createGameCore } from "./core.js";
import { defaultSettings, type GameSettings } from "./settings.js";

const MAX_FRAME_MS = 50;

export async function bootstrapGame(
	app: Application,
	uuid?: string,
	settings: GameSettings = defaultSettings(),
) {
	const assets = await loadAssets();

	const measureStyles = new Map<number, TextStyle>();
	const measureText = (text: string, fontSize: number) => {
		let style = measureStyles.get(fontSize);
		if (!style) {
			style = new TextStyle({ fontSize });
			measureStyles.set(fontSize, style);
		}
		const probe = new Text({ text, style });
		const size = { width: probe.width, height: probe.height };
		probe.destroy();
		return size;
	};

	const core = createGameCore(
		{
			screen: app.screen,
			settings,
			viewerStore: createViewerStore(uuid),
			measureText,
		},
		{ app, assets },
	);

	let timeScale = 1;
	let isDestroyed = false;

	const update = (ticker: Ticker) => {
		const dt = (Math.min(ticker.deltaMS, MAX_FRAME_MS) / 1000) * timeScale;
		core.step(dt);
	};

	app.ticker.add(update);

	return {
		world: core.world,

		joinViewer: core.joinViewer,
		applyShields: core.applyShields,
		grantBatteries: core.grantBatteries,
		grantRevives: core.grantRevives,
		doomsday: core.doomsday,
		repair: core.repair,
		removeBots: core.removeBots,
		changeSkin: core.changeSkin,
		shoot: core.shoot,
		startGame: core.startGame,
		setAfk: core.setAfk,
		respawn: core.respawn,
		reset: core.reset,

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

		destroy() {
			if (isDestroyed) return;
			isDestroyed = true;

			app.ticker?.remove(update);
			core.dispose();
		},
	};
}
