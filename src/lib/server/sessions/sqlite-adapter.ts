import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { SessionsRepo } from "./port.js";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionRow {
	token: string;
	broadcaster_id: string;
	expires_at: number;
}

export class SqliteSessionsRepo implements SessionsRepo {
	constructor(private readonly db: DatabaseSync) {
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS sessions (
				token TEXT PRIMARY KEY,
				broadcaster_id TEXT NOT NULL,
				expires_at INTEGER NOT NULL
			)
		`);
	}

	create(broadcasterId: string): string {
		const token = randomUUID();
		this.db
			.prepare(
				"INSERT INTO sessions (token, broadcaster_id, expires_at) VALUES (?, ?, ?)",
			)
			.run(token, broadcasterId, Date.now() + SESSION_TTL_MS);
		return token;
	}

	resolve(token: string): string | null {
		const row = this.db
			.prepare("SELECT * FROM sessions WHERE token = ?")
			.get(token) as SessionRow | undefined;
		if (!row) return null;

		if (row.expires_at < Date.now()) {
			this.remove(token);
			return null;
		}

		return row.broadcaster_id;
	}

	remove(token: string): void {
		this.db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
	}

	removeForBroadcaster(broadcasterId: string): void {
		this.db
			.prepare("DELETE FROM sessions WHERE broadcaster_id = ?")
			.run(broadcasterId);
	}
}
