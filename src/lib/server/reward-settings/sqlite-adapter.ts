import type { DatabaseSync } from "node:sqlite";
import type { RewardSettingsRepo } from "./port.js";

export class SqliteRewardSettingsRepo implements RewardSettingsRepo {
	constructor(private readonly db: DatabaseSync) {
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS reward_settings (
				broadcaster_id TEXT PRIMARY KEY,
				data TEXT NOT NULL
			)
		`);
	}

	load<T>(broadcasterId: string): T | null {
		const row = this.db
			.prepare("SELECT data FROM reward_settings WHERE broadcaster_id = ?")
			.get(broadcasterId) as { data: string } | undefined;
		return row ? (JSON.parse(row.data) as T) : null;
	}

	save(broadcasterId: string, value: unknown): void {
		this.db
			.prepare(
				`INSERT INTO reward_settings (broadcaster_id, data) VALUES (?, ?)
				ON CONFLICT (broadcaster_id) DO UPDATE SET data = excluded.data`,
			)
			.run(broadcasterId, JSON.stringify(value));
	}
}
