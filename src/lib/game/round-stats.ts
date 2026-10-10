import type { RoundStatEntry, RoundStats } from "./types.js";

export const createRoundStats = (): RoundStats => ({
	kills: {},
	misses: {},
	heals: {},
	doomsday: {},
});

export const bumpRoundStat = (
	stats: RoundStats,
	kind: keyof RoundStats,
	userId: string,
	user: string,
	amount = 1,
) => {
	const table = stats[kind];
	const entry = table[userId] ?? (table[userId] = { user, count: 0 });
	entry.user = user;
	entry.count += amount;
};

const topLine = (
	label: string,
	table: Record<string, RoundStatEntry>,
	limit: number,
): string | undefined => {
	const top = Object.values(table)
		.sort((a, b) => b.count - a.count)
		.slice(0, limit);
	if (top.length === 0) return undefined;
	return `${label}: ${top.map((entry) => `${entry.user} — ${entry.count}`).join(", ")}`;
};

export const formatRoundStats = (stats: RoundStats): string => {
	const lines = [
		topLine("сбито слов", stats.kills, 3),
		topLine("doomsday", stats.doomsday, 1),
		topLine("промахи", stats.misses, 1),
		topLine("починка", stats.heals, 1),
	].filter((line): line is string => line !== undefined);
	return lines.length > 0 ? `\n${lines.join("\n")}` : "";
};
