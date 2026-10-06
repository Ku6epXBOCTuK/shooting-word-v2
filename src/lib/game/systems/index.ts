import type { SystemGroup } from "./types.js";
import { createEnemySpawnSystem } from "./spawn-enemies.js";
import { createFlightSystem } from "./flight.js";
import { createPerspectiveSystem } from "./perspective.js";
import { createLifetimeSystem } from "./lifetime.js";
import { createWalkSystem } from "./walk.js";
import { createPlatformSystem } from "./platform.js";
import { createRenderSystem } from "./render.js";
import { createViewerRenderSystem } from "./viewer-render.js";

export function systemGroups(): SystemGroup[] {
	return [
		{
			name: "spawn",
			factories: [createEnemySpawnSystem],
		},
		{
			name: "flight",
			factories: [createFlightSystem],
		},
		{
			name: "perspective",
			factories: [createPerspectiveSystem],
		},
		{
			name: "lifetime",
			factories: [createLifetimeSystem],
		},
		{
			name: "walk",
			factories: [createWalkSystem],
		},
		{
			name: "render",
			factories: [
				createPlatformSystem,
				createRenderSystem,
				createViewerRenderSystem,
			],
		},
	];
}
