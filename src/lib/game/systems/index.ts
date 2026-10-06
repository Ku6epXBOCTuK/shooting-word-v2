import type { SystemGroup } from "./types.js";
import { createEnemySpawnSystem } from "./spawn-enemies.js";
import { createFlightSystem } from "./flight.js";
import { createPerspectiveSystem } from "./perspective.js";
import { createLifetimeSystem } from "./lifetime.js";
import { createWalkSystem } from "./walk.js";
import { createBulletSystem } from "./bullet.js";
import { createBulletRenderSystem } from "./bullet-render.js";
import { createStarSystem } from "./star.js";
import { createStarRenderSystem } from "./star-render.js";
import { createExplosionSystem } from "./explosion.js";
import { createExplosionRenderSystem } from "./explosion-render.js";
import { createEnemyShotSystem } from "./enemy-shot.js";
import { createEnemyShotRenderSystem } from "./enemy-shot-render.js";
import { createViewerTimeoutSystem } from "./viewer-timeout.js";
import { createViewerPersistenceSystem } from "./viewer-persistence.js";
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
			name: "combat",
			factories: [
				createBulletSystem,
				createEnemyShotSystem,
				createStarSystem,
				createExplosionSystem,
			],
		},
		{
			name: "viewers",
			factories: [
				createWalkSystem,
				createViewerTimeoutSystem,
				createViewerPersistenceSystem,
			],
		},
		{
			name: "render",
			factories: [
				createRenderSystem,
				createViewerRenderSystem,
				createBulletRenderSystem,
				createEnemyShotRenderSystem,
				createStarRenderSystem,
				createExplosionRenderSystem,
			],
		},
	];
}
