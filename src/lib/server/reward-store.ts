import { readFile, writeFile } from "node:fs/promises";

const STORE_FILE = "reward-ids.json";

let cache: Record<string, string> | null = null;

async function load(): Promise<Record<string, string>> {
	if (cache) return cache;

	try {
		cache = JSON.parse(await readFile(STORE_FILE, "utf-8")) as Record<
			string,
			string
		>;
	} catch {
		cache = {};
	}

	return cache;
}

export async function getRewardId(key: string): Promise<string | null> {
	const store = await load();
	return store[key] ?? null;
}

export async function setRewardId(key: string, id: string): Promise<void> {
	const store = await load();
	store[key] = id;
	await writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

export async function clearRewardIds(): Promise<void> {
	cache = {};
	await writeFile(STORE_FILE, "{}");
}
