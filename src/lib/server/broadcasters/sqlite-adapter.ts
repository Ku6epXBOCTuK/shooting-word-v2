import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { AccessToken } from "@twurple/auth";
import type { Broadcaster, BroadcastersRepo } from "./port.js";

interface BroadcasterRow {
	user_id: string;
	login: string;
	widget_uuid: string;
	token: string;
}

const toBroadcaster = (row: BroadcasterRow): Broadcaster => ({
	userId: row.user_id,
	login: row.login,
	widgetUuid: row.widget_uuid,
	token: JSON.parse(row.token) as AccessToken,
});

export class SqliteBroadcastersRepo implements BroadcastersRepo {
	constructor(private readonly db: DatabaseSync) {
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS broadcasters (
				user_id TEXT PRIMARY KEY,
				login TEXT NOT NULL,
				widget_uuid TEXT NOT NULL UNIQUE,
				token TEXT NOT NULL
			)
		`);
	}

	upsert(userId: string, login: string, token: AccessToken): Broadcaster {
		const existing = this.byUserId(userId);
		if (existing) {
			this.db
				.prepare(
					"UPDATE broadcasters SET login = ?, token = ? WHERE user_id = ?",
				)
				.run(login, JSON.stringify(token), userId);
			return { ...existing, login, token };
		}

		const widgetUuid = randomUUID();
		this.db
			.prepare(
				"INSERT INTO broadcasters (user_id, login, widget_uuid, token) VALUES (?, ?, ?, ?)",
			)
			.run(userId, login, widgetUuid, JSON.stringify(token));
		return { userId, login, widgetUuid, token };
	}

	byUserId(userId: string): Broadcaster | null {
		const row = this.db
			.prepare("SELECT * FROM broadcasters WHERE user_id = ?")
			.get(userId) as BroadcasterRow | undefined;
		return row ? toBroadcaster(row) : null;
	}

	byUuid(widgetUuid: string): Broadcaster | null {
		const row = this.db
			.prepare("SELECT * FROM broadcasters WHERE widget_uuid = ?")
			.get(widgetUuid) as BroadcasterRow | undefined;
		return row ? toBroadcaster(row) : null;
	}

	updateToken(userId: string, token: AccessToken): void {
		this.db
			.prepare("UPDATE broadcasters SET token = ? WHERE user_id = ?")
			.run(JSON.stringify(token), userId);
	}
}
