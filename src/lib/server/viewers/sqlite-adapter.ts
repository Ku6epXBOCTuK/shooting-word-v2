import type {
	ConsumableField,
	StoredViewer,
} from "#lib/features/persistence/index.js";
import { logger } from "#lib/logger.js";
import type { DatabaseSync } from "node:sqlite";
import type { ViewerProfile, ViewersRepo } from "./port.js";

// NOTE: a profile outlives its on-screen ship (timeout only removes the viewer
// entity), so rows older than the retention window and bots are purged once,
// when the database is opened.
export const PROFILE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

function parseProfile(raw: string): StoredViewer | null {
	try {
		const data = JSON.parse(raw) as unknown;
		if (typeof data !== "object" || data === null || Array.isArray(data)) {
			return null;
		}
		return data as StoredViewer;
	} catch {
		return null;
	}
}

export class SqliteViewersRepo implements ViewersRepo {
	constructor(
		private readonly db: DatabaseSync,
		private readonly now: () => number = Date.now,
	) {
		this.purge();
	}

	purge(): void {
		const rows = this.db
			.prepare("SELECT broadcaster_id, user_id, data FROM viewers")
			.all() as {
			broadcaster_id: string;
			user_id: string;
			data: string;
		}[];
		const now = this.now();
		const stale = rows.filter((row) => {
			const profile = parseProfile(row.data);
			if (!profile) return true;
			if (profile.bot) return true;
			return (
				typeof profile.lastSeen !== "number" ||
				now - profile.lastSeen > PROFILE_RETENTION_MS
			);
		});
		if (stale.length === 0) return;

		const remove = this.db.prepare(
			"DELETE FROM viewers WHERE broadcaster_id = ? AND user_id = ?",
		);
		this.db.exec("BEGIN");
		try {
			for (const row of stale) remove.run(row.broadcaster_id, row.user_id);
			this.db.exec("COMMIT");
		} catch (error) {
			this.db.exec("ROLLBACK");
			throw error;
		}
		logger.info(
			`[viewers] purged ${stale.length} profiles: ${stale
				.map((row) => row.user_id)
				.join(", ")}`,
		);
	}

	load<T>(broadcasterId: string): T[] {
		const rows = this.db
			.prepare("SELECT data FROM viewers WHERE broadcaster_id = ?")
			.all(broadcasterId) as { data: string }[];
		return rows.map((row) => JSON.parse(row.data) as T);
	}

	get<T>(broadcasterId: string, userId: string): T | null {
		const row = this.db
			.prepare(
				"SELECT data FROM viewers WHERE broadcaster_id = ? AND user_id = ?",
			)
			.get(broadcasterId, userId) as { data: string } | undefined;
		return row ? (JSON.parse(row.data) as T) : null;
	}

	upsert(broadcasterId: string, profiles: ViewerProfile[]): void {
		if (profiles.length === 0) return;
		// NOTE: Merge by userId: profiles missing from the batch are left untouched,
		// and a row with an older updated_at never overwrites a fresher one.
		const insert = this.db.prepare(`
			INSERT INTO viewers (broadcaster_id, user_id, data, updated_at)
			VALUES (?, ?, ?, ?)
			ON CONFLICT (broadcaster_id, user_id) DO UPDATE SET
				data = excluded.data,
				updated_at = excluded.updated_at
			WHERE excluded.updated_at >= viewers.updated_at
		`);

		this.db.exec("BEGIN");
		try {
			for (const profile of profiles) {
				insert.run(
					broadcasterId,
					profile.userId,
					JSON.stringify(profile.data),
					profile.updatedAt,
				);
			}
			this.db.exec("COMMIT");
		} catch (error) {
			this.db.exec("ROLLBACK");
			throw error;
		}
	}

	increment(
		broadcasterId: string,
		userId: string,
		field: ConsumableField,
		delta: number,
		cap: number,
		meta: { user: string },
	): number {
		const now = this.now();
		const current = this.get<StoredViewer>(broadcasterId, userId) ?? {
			userId,
			user: meta.user,
			login: meta.user.toLowerCase(),
			lastSeen: now,
			skin: 0,
			xp: 0,
			batteries: 0,
			revives: 0,
			beacons: 0,
		};
		const value = Math.max(
			0,
			Math.min(cap, Number(current[field] ?? 0) + delta),
		);
		const data: StoredViewer = { ...current, [field]: value, updatedAt: now };

		this.db
			.prepare(
				`INSERT INTO viewers (broadcaster_id, user_id, data, updated_at)
				VALUES (?, ?, ?, ?)
				ON CONFLICT (broadcaster_id, user_id) DO UPDATE SET
					data = excluded.data,
					updated_at = excluded.updated_at`,
			)
			.run(broadcasterId, userId, JSON.stringify(data), now);
		return value;
	}
}
