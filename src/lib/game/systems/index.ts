import type { SystemGroup } from "./types.js";
import { createMovementSystem } from "./movement.js";
import { createCleanupSystem } from "./cleanup.js";
import { createRenderSystem } from "./render.js";

export function systemGroups(): SystemGroup[] {
	return [
		{
			name: "physics",
			factories: [createMovementSystem],
		},
		{
			name: "lifecycle",
			factories: [createCleanupSystem],
		},
		{
			name: "render",
			factories: [createRenderSystem],
		},
	];
}
