import { appendFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { addLogSink, logger } from "#lib/logger.js";

const DAY_MS = 86_400_000;
const FILE_PATTERN = /^app-(\d{4}-\d{2}-\d{2})\.log$/;

export function planLogPrune(
	files: string[],
	now: Date,
	retentionDays: number,
): string[] {
	const cutoff = now.getTime() - retentionDays * DAY_MS;
	return files.filter((name) => {
		const match = FILE_PATTERN.exec(name);
		if (!match) return false;
		const day = Date.parse(`${match[1]}T00:00:00.000Z`);
		if (Number.isNaN(day)) return false;
		return day < cutoff;
	});
}

function dayStamp(now: Date): string {
	return now.toISOString().slice(0, 10);
}

function prune(dir: string, retentionDays: number): void {
	for (const name of planLogPrune(
		readdirSync(dir),
		new Date(),
		retentionDays,
	)) {
		rmSync(join(dir, name), { force: true });
	}
}

function init(): void {
	const dir = process.env.LOG_DIR;
	if (!dir) return;
	const parsed = Number(process.env.LOG_RETENTION_DAYS ?? "7");
	const retentionDays =
		Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 7;
	mkdirSync(dir, { recursive: true });
	let day = "";
	addLogSink((line) => {
		try {
			const today = dayStamp(new Date());
			if (today !== day) {
				day = today;
				prune(dir, retentionDays);
			}
			appendFileSync(join(dir, `app-${today}.log`), `${line}\n`);
		} catch {
			// NOTE: file logging must never crash the app
		}
	});
	try {
		prune(dir, retentionDays);
	} catch {
		// NOTE: a missing/unreadable dir only disables pruning, stdout still works
	}
	logger.info(
		`[log] file logging to ${dir}/app-*.log, retention ${retentionDays}d`,
	);
}

init();
