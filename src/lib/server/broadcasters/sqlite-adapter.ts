import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { AccessToken } from "@twurple/auth";
import type { Broadcaster, BroadcastersRepo } from "./port.js";

interface BroadcasterRow {
	user_id: string;
	login: string;
	display_name: string | null;
	widget_uuid: string;
	token: string;
}

const toBroadcaster = (row: BroadcasterRow): Broadcaster => ({
	userId: row.user_id,
	login: row.login,
	displayName: row.display_name,
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

		const columns = this.db
			.prepare("PRAGMA table_info(broadcasters)")
			.all() as { name: string }[];
		if (!columns.some((column) => column.name === "display_name")) {
			this.db.exec("ALTER TABLE broadcasters ADD COLUMN display_name TEXT");
		}
	}

	upsert(
		userId: string,
		login: string,
		displayName: string | null,
		token: AccessToken,
	): Broadcaster {
		const existing = this.byUserId(userId);
		if (existing) {
			this.db
				.prepare(
					"UPDATE broadcasters SET login = ?, display_name = ?, token = ? WHERE user_id = ?",
				)
				.run(login, displayName, JSON.stringify(token), userId);
			return { ...existing, login, displayName, token };
		}

		const widgetUuid = randomUUID();
		this.db
			.prepare(
				"INSERT INTO broadcasters (user_id, login, display_name, widget_uuid, token) VALUES (?, ?, ?, ?, ?)",
			)
			.run(userId, login, displayName, widgetUuid, JSON.stringify(token));
		return { userId, login, displayName, widgetUuid, token };
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

	rotateUuid(userId: string): string {
		const widgetUuid = randomUUID();
		this.db
			.prepare("UPDATE broadcasters SET widget_uuid = ? WHERE user_id = ?")
			.run(widgetUuid, userId);
		return widgetUuid;
	}

	remove(userId: string): void {
		this.db.prepare("DELETE FROM broadcasters WHERE user_id = ?").run(userId);
	}
}
