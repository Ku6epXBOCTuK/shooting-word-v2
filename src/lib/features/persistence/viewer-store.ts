import type { Viewer } from "../../game/types.js";
import type { StoragePort } from "./port.js";

const KEY = "viewers";

export const CONSUMABLE_FIELDS = ["batteries", "revives", "beacons"] as const;
export type ConsumableField = (typeof CONSUMABLE_FIELDS)[number];

export type StoredViewer = Viewer & {
	xp: number;
	// NOTE: content version, bumped only on real data changes; the server rejects
	// a record with an older version so a stale snapshot (second tab, start race)
	// cannot roll back fresher data.
	updatedAt?: number;
} & Record<ConsumableField, number>;

// NOTE: absolute server-side consumable counts; the widget applies them as a sync
// (max) instead of `+1`, so double granting is impossible.
export interface ConsumableSync {
	userId: string;
	batteries?: number;
	revives?: number;
	beacons?: number;
}

export function isStoredViewer(value: unknown): value is StoredViewer {
	if (typeof value !== "object" || value === null) return false;
	const viewer = value as Record<string, unknown>;
	return (
		typeof viewer.userId === "string" &&
		typeof viewer.user === "string" &&
		typeof viewer.login === "string" &&
		typeof viewer.lastSeen === "number" &&
		(viewer.xp === undefined || typeof viewer.xp === "number") &&
		(viewer.batteries === undefined || typeof viewer.batteries === "number") &&
		(viewer.revives === undefined || typeof viewer.revives === "number") &&
		(viewer.beacons === undefined || typeof viewer.beacons === "number") &&
		(viewer.bot === undefined || typeof viewer.bot === "boolean") &&
		(viewer.skin === undefined || typeof viewer.skin === "number") &&
		(viewer.updatedAt === undefined || typeof viewer.updatedAt === "number")
	);
}

const PROFILE_FIELDS = [
	"userId",
	"user",
	"login",
	"lastSeen",
	"skin",
	"bot",
	"xp",
	"batteries",
	"revives",
	"beacons",
] as const;

function contentKey(viewer: StoredViewer): string {
	return JSON.stringify(
		PROFILE_FIELDS.map((field) => viewer[field] as unknown),
	);
}

// NOTE: an unchanged profile is returned as is so the version stays put and other
// writers are not told "data changed"; a changed one is stamped with `now`.
export function mergeProfile(
	prev: StoredViewer | undefined,
	next: StoredViewer,
	now: number,
): StoredViewer {
	if (prev && contentKey(prev) === contentKey(next)) return prev;
	return { ...next, updatedAt: now };
}

export class ViewerStore {
	private loading: Promise<StoredViewer[]> | null = null;

	constructor(private readonly storage: StoragePort) {}

	// NOTE: first load starts the read, later calls await the same promise so a
	// save cannot overtake the read and persist a partial list.
	load(): Promise<StoredViewer[]> {
		this.loading ??= this.fetch();
		return this.loading;
	}

	private async fetch(): Promise<StoredViewer[]> {
		let parsed: unknown;
		try {
			parsed = await this.storage.load(KEY);
		} catch {
			return [];
		}
		if (!Array.isArray(parsed)) return [];

		return parsed.filter(isStoredViewer).map((viewer) => ({
			...viewer,
			xp: viewer.xp ?? 0,
			batteries: viewer.batteries ?? 0,
			revives: viewer.revives ?? 0,
			beacons: viewer.beacons ?? 0,
			skin: viewer.skin ?? 0,
		}));
	}

	async save(viewers: StoredViewer[]): Promise<void> {
		await this.load();
		await this.storage.save(KEY, viewers);
	}
}
