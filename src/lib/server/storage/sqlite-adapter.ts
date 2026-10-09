import type { DatabaseSync } from "node:sqlite";
import type { StorageRepo } from "./port.js";

export class SqliteStorageRepo implements StorageRepo {
	constructor(private readonly db: DatabaseSync) {
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS storage (
				broadcaster_id TEXT NOT NULL,
				key TEXT NOT NULL,
				data TEXT NOT NULL,
				PRIMARY KEY (broadcaster_id, key)
			)
		`);
	}

	load<T>(broadcasterId: string, key: string): T | null {
		const row = this.db
			.prepare("SELECT data FROM storage WHERE broadcaster_id = ? AND key = ?")
			.get(broadcasterId, key) as { data: string } | undefined;
		return row ? (JSON.parse(row.data) as T) : null;
	}

	save(broadcasterId: string, key: string, value: unknown): void {
		this.db
			.prepare(
				"INSERT OR REPLACE INTO storage (broadcaster_id, key, data) VALUES (?, ?, ?)",
			)
			.run(broadcasterId, key, JSON.stringify(value));
	}
}
