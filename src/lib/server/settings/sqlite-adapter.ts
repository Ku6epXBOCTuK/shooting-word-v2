import type { DatabaseSync } from "node:sqlite";
import type { SettingsRepo } from "./port.js";

export class SqliteSettingsRepo implements SettingsRepo {
	constructor(private readonly db: DatabaseSync) {}

	load<T>(broadcasterId: string): T | null {
		const row = this.db
			.prepare("SELECT data FROM settings WHERE broadcaster_id = ?")
			.get(broadcasterId) as { data: string } | undefined;
		return row ? (JSON.parse(row.data) as T) : null;
	}

	save(broadcasterId: string, value: unknown): void {
		this.db
			.prepare(
				`INSERT INTO settings (broadcaster_id, data) VALUES (?, ?)
				ON CONFLICT (broadcaster_id) DO UPDATE SET data = excluded.data`,
			)
			.run(broadcasterId, JSON.stringify(value));
	}
}
