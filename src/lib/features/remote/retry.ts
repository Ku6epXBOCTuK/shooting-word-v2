import { isHttpError } from "@sveltejs/kit";

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_DELAY_MS = 300;
const DEFAULT_TIMEOUT_MS = 10_000;

export interface RetryOptions {
	attempts?: number;
	delayMs?: number;
	timeoutMs?: number;
}

// NOTE: only idempotent remote commands may be replayed - a refund or an
// appended record must not run twice because a response got lost.
export async function withRetry<T>(
	run: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
	const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

	let lastError: unknown;

	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			return await withTimeout(run(), timeoutMs);
		} catch (error) {
			if (isHttpError(error) && error.status < 500) throw error;

			lastError = error;
			if (attempt < attempts) {
				await new Promise((resolve) => {
					setTimeout(resolve, delayMs * 2 ** (attempt - 1));
				});
			}
		}
	}

	throw lastError;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`remote call timed out after ${ms}ms`));
		}, ms);

		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error: unknown) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}
