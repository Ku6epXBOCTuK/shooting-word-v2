export interface Logger {
	debug(...args: unknown[]): void;
	info(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	error(...args: unknown[]): void;
}

const noop = () => {};

const isDev = import.meta.env.DEV;

export const logger: Logger = {
	debug: isDev ? console.debug.bind(console) : noop,
	info: isDev ? console.info.bind(console) : noop,
	warn: isDev ? console.warn.bind(console) : noop,
	error: console.error.bind(console),
};
