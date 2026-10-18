import type { RenderSystemGroup, SystemGroup } from "./types.js";
import { createSessionSystem } from "./session.js";
import { createRoundResetSystem } from "./round-reset.js";
import { createRoundLogSystem } from "./round-log.js";
import { createEnemySpawnSystem } from "./spawn-enemies.js";
import { createFlightSystem } from "./flight.js";
import { createPerspectiveSystem } from "./perspective.js";
import { createLifetimeSystem } from "./lifetime.js";
import { createDoomsdaySystem } from "./doomsday.js";
import { createTimeStopSystem } from "./time-stop.js";
import { createDoomsdayRenderSystem } from "./doomsday-render.js";
import { createVfxRenderSystem } from "./vfx-render.js";
import { createVfxSystem } from "./vfx.js";
import { createWalkSystem } from "./walk.js";
import { createMeasureSystem } from "./measure.js";
import { createShieldSystem } from "./shield.js";
import { createShieldRegenSystem } from "./shield-regen.js";
import { createOverchargeSystem } from "./overcharge.js";
import { createArmorCoatingSystem } from "./armor-coating.js";
import { createRespawnSchedulerSystem } from "./respawn-scheduler.js";
import { createRespawnSystem } from "./respawn.js";
import { createReviveSystem } from "./revive.js";
import { createHomingSystem } from "./homing.js";
import { createEnemyAttackSystem } from "./enemy-attack.js";
import { createEnemyFireSystem } from "./enemy-fire.js";
import { createBulletHitSystem } from "./bullet-hit.js";
import { createWordKillSystem } from "./word-kill.js";
import { createBulletRenderSystem } from "./bullet-render.js";
import { createEnemyShotHitSystem } from "./enemy-shot-hit.js";
import { createEnemyShotRenderSystem } from "./enemy-shot-render.js";
import { createViewerTimeoutSystem } from "./viewer-timeout.js";
import { createViewerPersistenceSystem } from "./viewer-persistence.js";
import { createRenderSystem } from "./render.js";
import { createBannerRenderSystem } from "./banner-render.js";
import { createPortalRenderSystem } from "./portal-render.js";
import { createViewerRenderSystem } from "./viewer-render.js";
import { createVfxTickSystem } from "./vfx-tick.js";
import { createCleanupSystem } from "./cleanup.js";

export function logicGroups(): SystemGroup[] {
	return [
		{
			name: "session",
			factories: [
				createSessionSystem,
				createRoundResetSystem,
				createRoundLogSystem,
			],
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
				createDoomsdaySystem,
				createTimeStopSystem,
				createVfxSystem,
			],
		},
		{
			name: "viewers",
			factories: [
				createMeasureSystem,
				createWalkSystem,
				createShieldSystem,
				createShieldRegenSystem,
				createOverchargeSystem,
				createArmorCoatingSystem,
				createRespawnSchedulerSystem,
				createRespawnSystem,
				createReviveSystem,
				createViewerTimeoutSystem,
				createViewerPersistenceSystem,
			],
		},
	];
}

export function renderGroups(): RenderSystemGroup[] {
	return [
		{
			name: "render",
			factories: [
				createRenderSystem,
				createBannerRenderSystem,
				createPortalRenderSystem,
				createViewerRenderSystem,
				createBulletRenderSystem,
				createEnemyShotRenderSystem,
				createVfxRenderSystem,
				createDoomsdayRenderSystem,
				createVfxTickSystem,
			],
		},
	];
}

export function cleanupGroups(): SystemGroup[] {
	return [
		{
			name: "cleanup",
			factories: [createCleanupSystem],
		},
	];
}
