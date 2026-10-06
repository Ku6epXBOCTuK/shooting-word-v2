import type { World } from "miniplex";
import type { Entity, Viewer } from "./types.js";

const STORAGE_KEY = "shooting-word:viewers";

export type StoredViewer = Viewer & { xp: number };

function isStoredViewer(value: unknown): value is StoredViewer {
	if (typeof value !== "object" || value === null) return false;
	const viewer = value as Record<string, unknown>;
	return (
		typeof viewer.userId === "string" &&
		typeof viewer.user === "string" &&
		typeof viewer.lastSeen === "number" &&
		(viewer.xp === undefined || typeof viewer.xp === "number")
	);
}

export function loadViewers(): StoredViewer[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.filter(isStoredViewer).map((viewer) => ({
			...viewer,
			xp: viewer.xp ?? 0,
		}));
	} catch {
		return [];
	}
}

export function persistViewers(world: World<Entity>): void {
	const viewers: StoredViewer[] = [];
	for (const entity of world.with("viewer")) {
		viewers.push({ ...entity.viewer, xp: entity.xp ?? 0 });
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(viewers));
	} catch {
		// storage full or unavailable — ignore
	}
}
