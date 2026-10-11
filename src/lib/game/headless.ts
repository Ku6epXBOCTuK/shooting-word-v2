import type { RoundRecord } from "#lib/features/rounds/record.js";
import { ViewerStore } from "#lib/features/persistence/viewer-store.js";
import { createGameCore } from "./core.js";
import type { GameSettings } from "./settings.js";
import { estimateWordSize } from "./spawn.js";
import type { Size } from "./types.js";

export interface HeadlessGameOptions {
	screen?: Size;
	settings?: GameSettings;
	rng?: () => number;
	now?: () => number;
	onRoundEnd?: (record: RoundRecord) => void;
}

export function createHeadlessGame(options: HeadlessGameOptions = {}) {
	return createGameCore({
		screen: options.screen ?? { width: 1920, height: 1080 },
		settings: options.settings,
		viewerStore: new ViewerStore({
			load: () => Promise.resolve(null),
			save: () => Promise.resolve(),
		}),
		onRoundEnd: options.onRoundEnd,
		now: options.now,
		rng: options.rng,
		measureText: estimateWordSize,
	});
}
