import type { SystemGroup } from "./types.js";
import { createSessionSystem } from "./session.js";
import { createEnemySpawnSystem } from "./spawn-enemies.js";
import { createFlightSystem } from "./flight.js";
import { createPerspectiveSystem } from "./perspective.js";
import { createLifetimeSystem } from "./lifetime.js";
import { createWalkSystem } from "./walk.js";
import { createMeasureSystem } from "./measure.js";
import { createShieldSystem } from "./shield.js";
import { createShieldRegenSystem } from "./shield-regen.js";
import { createRespawnSchedulerSystem } from "./respawn-scheduler.js";
import { createRespawnSystem } from "./respawn.js";
import { createHomingSystem } from "./homing.js";
import { createEnemyAttackSystem } from "./enemy-attack.js";
import { createEnemyFireSystem } from "./enemy-fire.js";
import { createBulletHitSystem } from "./bullet-hit.js";
import { createWordKillSystem } from "./word-kill.js";
import { createBulletRenderSystem } from "./bullet-render.js";
import { createStarSystem } from "./star.js";
import { createStarRenderSystem } from "./star-render.js";
import { createExplosionSystem } from "./explosion.js";
import { createExplosionRenderSystem } from "./explosion-render.js";
import { createEnemyShotHitSystem } from "./enemy-shot-hit.js";
import { createRicochetSystem } from "./ricochet.js";
import { createRicochetRenderSystem } from "./ricochet-render.js";
import { createSparkSystem } from "./spark.js";
import { createSparkRenderSystem } from "./spark-render.js";
import { createEnemyShotRenderSystem } from "./enemy-shot-render.js";
import { createViewerTimeoutSystem } from "./viewer-timeout.js";
import { createViewerPersistenceSystem } from "./viewer-persistence.js";
import { createRenderSystem } from "./render.js";
import { createBannerRenderSystem } from "./banner-render.js";
import { createPortalRenderSystem } from "./portal-render.js";
import { createViewerRenderSystem } from "./viewer-render.js";
import { createCleanupSystem } from "./cleanup.js";

export function systemGroups(): SystemGroup[] {
	return [
		{
			name: "session",
			factories: [createSessionSystem],
		},
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
				createEnemyAttackSystem,
				createEnemyFireSystem,
				createHomingSystem,
				createBulletHitSystem,
				createWordKillSystem,
				createEnemyShotHitSystem,
				createRicochetSystem,
				createSparkSystem,
				createStarSystem,
				createExplosionSystem,
			],
		},
		{
			name: "viewers",
			factories: [
				createMeasureSystem,
				createWalkSystem,
				createShieldSystem,
				createShieldRegenSystem,
				createRespawnSchedulerSystem,
				createRespawnSystem,
				createViewerTimeoutSystem,
				createViewerPersistenceSystem,
			],
		},
		{
			name: "render",
			factories: [
				createRenderSystem,
				createBannerRenderSystem,
				createPortalRenderSystem,
				createViewerRenderSystem,
				createBulletRenderSystem,
				createEnemyShotRenderSystem,
				createRicochetRenderSystem,
				createSparkRenderSystem,
				createStarRenderSystem,
				createExplosionRenderSystem,
			],
		},
		{
			name: "cleanup",
			factories: [createCleanupSystem],
		},
	];
}
