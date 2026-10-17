import type { DatabaseSync } from "node:sqlite";
import { Migrator } from "@ku6epxboctuk/sqlite-up";

export async function migrateDb(db: DatabaseSync): Promise<void> {
	const result = await new Migrator({
		db,
		migrationsDir: "migrations",
	}).apply();
	if (!result.success) {
		throw result.error ?? new Error("migrations failed");
	}
}
