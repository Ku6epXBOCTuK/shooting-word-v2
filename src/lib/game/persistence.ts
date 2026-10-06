import type { World } from "miniplex";
import type { Entity, Viewer } from "./types.js";

const STORAGE_KEY = "shooting-word:viewers";

function isViewer(value: unknown): value is Viewer {
	if (typeof value !== "object" || value === null) return false;
	const viewer = value as Record<string, unknown>;
	return (
		typeof viewer.userId === "string" &&
		typeof viewer.user === "string" &&
		typeof viewer.lastSeen === "number"
	);
}

export function loadViewers(): Viewer[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.filter(isViewer);
	} catch {
		return [];
	}
}

export function persistViewers(world: World<Entity>): void {
	const viewers: Viewer[] = [];
	for (const entity of world.with("viewer")) {
		viewers.push(entity.viewer);
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(viewers));
	} catch {
		// storage full or unavailable — ignore
	}
}
