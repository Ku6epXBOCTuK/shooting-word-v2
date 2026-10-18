import type { AccessToken } from "@twurple/auth";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
	Broadcaster,
	BroadcastersRepo,
	WidgetClaimResult,
} from "./port.js";

const hashWidgetKey = (key: string): string =>
	createHash("sha256").update(key).digest("hex");

const keysMatch = (stored: string, key: string): boolean => {
	const a = Buffer.from(stored, "hex");
	const b = createHash("sha256").update(key).digest();
	return a.length === b.length && timingSafeEqual(a, b);
};

interface BroadcasterRow {
	user_id: string;
	login: string;
	display_name: string | null;
	widget_uuid: string;
	widget_key: string | null;
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
	constructor(private readonly db: DatabaseSync) {}

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

	claimWidget(widgetUuid: string, key: string): WidgetClaimResult | null {
		const row = this.db
			.prepare("SELECT * FROM broadcasters WHERE widget_uuid = ?")
			.get(widgetUuid) as BroadcasterRow | undefined;
		if (!row) return null;

		const broadcaster = toBroadcaster(row);
		if (row.widget_key === null) {
			this.db
				.prepare("UPDATE broadcasters SET widget_key = ? WHERE widget_uuid = ?")
				.run(hashWidgetKey(key), widgetUuid);
			return { claim: "first", broadcaster };
		}

		return {
			claim: keysMatch(row.widget_key, key) ? "owner" : "duplicate",
			broadcaster,
		};
	}

	rotateUuid(userId: string): string {
		const widgetUuid = randomUUID();
		this.db
			.prepare(
				"UPDATE broadcasters SET widget_uuid = ?, widget_key = NULL WHERE user_id = ?",
			)
			.run(widgetUuid, userId);
		return widgetUuid;
	}

	remove(userId: string): void {
		this.db.prepare("DELETE FROM broadcasters WHERE user_id = ?").run(userId);
	}
}
