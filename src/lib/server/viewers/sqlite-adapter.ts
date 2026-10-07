import type { DatabaseSync } from "node:sqlite";
import type { ViewerEntry, ViewersRepo } from "./port.js";

export class SqliteViewersRepo implements ViewersRepo {
	constructor(private readonly db: DatabaseSync) {
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS viewers (
				broadcaster_id TEXT NOT NULL,
				user_id TEXT NOT NULL,
				data TEXT NOT NULL,
				PRIMARY KEY (broadcaster_id, user_id)
			)
		`);
	}

	load<T>(broadcasterId: string): T[] {
		const rows = this.db
			.prepare("SELECT data FROM viewers WHERE broadcaster_id = ?")
			.all(broadcasterId) as { data: string }[];
		return rows.map((row) => JSON.parse(row.data) as T);
	}

	save(broadcasterId: string, viewers: ViewerEntry[]): void {
		const clear = this.db.prepare(
			"DELETE FROM viewers WHERE broadcaster_id = ?",
		);
		const insert = this.db.prepare(
			"INSERT INTO viewers (broadcaster_id, user_id, data) VALUES (?, ?, ?)",
		);

		this.db.exec("BEGIN");
		try {
			clear.run(broadcasterId);
			for (const viewer of viewers) {
				insert.run(broadcasterId, viewer.userId, JSON.stringify(viewer.data));
			}
			this.db.exec("COMMIT");
		} catch (error) {
			this.db.exec("ROLLBACK");
			throw error;
		}
	}
}
