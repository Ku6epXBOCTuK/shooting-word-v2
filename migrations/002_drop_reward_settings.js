// NOTE: reward titles, descriptions, costs and cooldowns now live only on
// Twitch, so the local override table has no readers left.
export const up = async (db) => {
	await db.exec("DROP TABLE IF EXISTS reward_settings");
};

export const down = async (db) => {
	await db.exec(`
		CREATE TABLE reward_settings (
			broadcaster_id TEXT PRIMARY KEY,
			data TEXT NOT NULL
		)
	`);
};
