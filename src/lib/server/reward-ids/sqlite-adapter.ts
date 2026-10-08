import type { DatabaseSync } from "node:sqlite";
import type { RewardIdsRepo } from "./port.js";

export class SqliteRewardIdsRepo implements RewardIdsRepo {
	constructor(private readonly db: DatabaseSync) {
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS reward_ids (
				broadcaster_id TEXT NOT NULL,
				key TEXT NOT NULL,
				reward_id TEXT NOT NULL,
				PRIMARY KEY (broadcaster_id, key)
			)
		`);
	}

	get(broadcasterId: string, key: string): string | null {
		const row = this.db
			.prepare(
				"SELECT reward_id FROM reward_ids WHERE broadcaster_id = ? AND key = ?",
			)
			.get(broadcasterId, key) as { reward_id: string } | undefined;
		return row?.reward_id ?? null;
	}

	set(broadcasterId: string, key: string, rewardId: string): void {
		this.db
			.prepare(
				"INSERT OR REPLACE INTO reward_ids (broadcaster_id, key, reward_id) VALUES (?, ?, ?)",
			)
			.run(broadcasterId, key, rewardId);
	}

	list(broadcasterId: string): { key: string; rewardId: string }[] {
		const rows = this.db
			.prepare("SELECT key, reward_id FROM reward_ids WHERE broadcaster_id = ?")
			.all(broadcasterId) as { key: string; reward_id: string }[];
		return rows.map(({ key, reward_id }) => ({ key, rewardId: reward_id }));
	}

	clear(broadcasterId: string): void {
		this.db
			.prepare("DELETE FROM reward_ids WHERE broadcaster_id = ?")
			.run(broadcasterId);
	}
}
