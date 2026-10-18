// NOTE: the reward key was renamed in code from "ricochetium" to "armorCoating";
// without this update existing channels resolve its redemptions to key=unknown.
export const up = async (db) => {
	await db.exec(
		"UPDATE reward_ids SET key = 'armorCoating' WHERE key = 'ricochetium'",
	);
};

export const down = async (db) => {
	await db.exec(
		"UPDATE reward_ids SET key = 'ricochetium' WHERE key = 'armorCoating'",
	);
};
