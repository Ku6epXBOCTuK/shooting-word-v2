import type { SystemGroup } from "./types.js";
import { createEnemySpawnSystem } from "./spawn-enemies.js";
import { createChatSpawnSystem } from "./spawn-chat.js";
import { createFlightSystem } from "./flight.js";
import { createPerspectiveSystem } from "./perspective.js";
import { createLifetimeSystem } from "./lifetime.js";
import { createRenderSystem } from "./render.js";

export function systemGroups(): SystemGroup[] {
	return [
		{
			name: "spawn",
			factories: [createEnemySpawnSystem, createChatSpawnSystem],
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
			name: "render",
			factories: [createRenderSystem],
		},
	];
}
