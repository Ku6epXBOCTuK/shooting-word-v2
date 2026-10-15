export interface Logger {
	debug(...args: unknown[]): void;
	info(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	error(...args: unknown[]): void;
}

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export type LogSink = (line: string) => void;

const LEVEL_WEIGHT: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
	silent: 100,
};

const sinks: LogSink[] = [];

export function addLogSink(sink: LogSink): void {
	sinks.push(sink);
}

export function parseLevel(raw: string | undefined): LogLevel | null {
	if (!raw) return null;
	const normalized = raw.trim().toLowerCase();
	return normalized in LEVEL_WEIGHT ? (normalized as LogLevel) : null;
}

export function resolveLevel(
	isDev: boolean,
	isServer: boolean,
	raw: string | undefined,
): LogLevel {
	if (isDev) return "debug";
	const fromEnv = parseLevel(raw);
	if (fromEnv) return fromEnv;
	return isServer ? "info" : "error";
}

function formatArg(arg: unknown): string {
	if (typeof arg === "string") return arg;
	if (arg instanceof Error) return arg.stack ?? String(arg);
	try {
		return JSON.stringify(arg) ?? String(arg);
	} catch {
		return String(arg);
	}
}

export function formatLine(
	level: Exclude<LogLevel, "silent">,
	args: unknown[],
): string {
	return `${new Date().toISOString()} ${level.toUpperCase()} ${args
		.map(formatArg)
		.join(" ")}`;
}

function readEnv(name: string): string | undefined {
	return typeof process !== "undefined" ? process.env[name] : undefined;
}

const threshold =
	LEVEL_WEIGHT[
		resolveLevel(import.meta.env.DEV, import.meta.env.SSR, readEnv("LOG_LEVEL"))
	];

function emit(level: Exclude<LogLevel, "silent">, args: unknown[]): void {
	if (LEVEL_WEIGHT[level] < threshold) return;
	const plain = import.meta.env.SSR && !import.meta.env.DEV;
	if (plain || sinks.length > 0) {
		const line = formatLine(level, args);
		for (const sink of sinks) sink(line);
		if (plain) {
			console[level](line);
			return;
		}
	}
	console[level](...args);
}

export const logger: Logger = {
	debug: (...args) => emit("debug", args),
	info: (...args) => emit("info", args),
	warn: (...args) => emit("warn", args),
	error: (...args) => emit("error", args),
};
